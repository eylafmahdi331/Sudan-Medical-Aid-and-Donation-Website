<?php
require 'db.php'; 

header('Content-Type: application/json');

try {
    // 1. Capture Form Inputs
    $providerName   = $_POST['providerName'] ?? '';
    $providerType   = $_POST['providerType'] ?? '';
    $licenseNumber  = $_POST['licenseNumber'] ?? '';
    $providerPhone  = $_POST['phone'] ?? null;
    $providerEmail  = $_POST['email'] ?? null;
    $providerAddress = $_POST['address'] ?? null;

    // The Case ID selected from the dropdown
    $selectedCaseId = $_POST['caseToSupport'] ?? ''; 

    $serviceName    = $_POST['serviceName'] ?? '';
    $serviceType    = $_POST['serviceType'] ?? '';
    $coverageType   = $_POST['donationType'] ?? '';
    $serviceValue   = $_POST['estimatedValue'] ?? 0;

    // Get doctors array from JSON
    $doctorsJson = $_POST['doctors'] ?? '[]';
    $doctors = json_decode($doctorsJson, true);
    if (!is_array($doctors) || empty($doctors)) {
        throw new Exception('At least one doctor is required.');
    }

    $editProviderId = $_POST['editProviderId'] ?? null;

    // 2. Validation
    if (!$providerName || !$licenseNumber || !$selectedCaseId) {
        throw new Exception('Missing required fields, including the selected case.');
    }

    $pdo->beginTransaction();

    if ($editProviderId) {
        // Update existing provider
        $stmt = $pdo->prepare("
            UPDATE MEDICAL_PROVIDER 
            SET PROVIDER_NAME=?, PROVIDER_TYPE=?, LICENSE_NUMBER=?, PROVIDER_PHONE=?, PROVIDER_EMAIL=?, PROVIDER_ADDRESS=?
            WHERE PROVIDER_ID=?
        ");
        $stmt->execute([$providerName, $providerType, $licenseNumber, $providerPhone, $providerEmail, $providerAddress, $editProviderId]);
        $providerId = $editProviderId;

        // Remove old related records
        $pdo->prepare("DELETE FROM CASE_PROVIDER WHERE PROVIDER_ID=?")->execute([$providerId]);
        $pdo->prepare("DELETE FROM DOCTOR WHERE PROVIDER_ID=?")->execute([$providerId]);
        $pdo->prepare("DELETE FROM PROVIDER_DONATION WHERE PROVIDER_ID=?")->execute([$providerId]);
    } else {
        // 3. Insert or Get Provider
        // Check if provider exists by license number OR email
        $stmt = $pdo->prepare("SELECT PROVIDER_ID FROM MEDICAL_PROVIDER WHERE LICENSE_NUMBER = ? OR (PROVIDER_EMAIL = ? AND PROVIDER_EMAIL IS NOT NULL)");
        $stmt->execute([$licenseNumber, $providerEmail]);
        $provider = $stmt->fetch();

        if ($provider) {
            $providerId = $provider['PROVIDER_ID'];
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO MEDICAL_PROVIDER 
                (PROVIDER_NAME, PROVIDER_TYPE, LICENSE_NUMBER, PROVIDER_PHONE, PROVIDER_EMAIL, PROVIDER_ADDRESS)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$providerName, $providerType, $licenseNumber, $providerPhone, $providerEmail, $providerAddress]);
            $providerId = $pdo->lastInsertId();
        }
    }

    // 4. INSERT INTO BRIDGE ENTITY (CASE_PROVIDER)
    // This connects the specific case from your dropdown to this provider
    $stmtCheck = $pdo->prepare("SELECT 1 FROM CASE_PROVIDER WHERE CASE_ID = ? AND PROVIDER_ID = ?");
    $stmtCheck->execute([$selectedCaseId, $providerId]);
    
    if (!$stmtCheck->fetch()) {
        $stmtBridge = $pdo->prepare("
            INSERT INTO CASE_PROVIDER (CASE_ID, PROVIDER_ID, ASSIGNMENT_STATUS)
            VALUES (?, ?, 'pending')
        ");
        $stmtBridge->execute([$selectedCaseId, $providerId]);
    }

    // 5. Insert Doctors (allow multiple)
    // Get the maximum DOCTOR_NUM for this provider
    $stmtMax = $pdo->prepare("SELECT MAX(DOCTOR_NUM) as maxNum FROM DOCTOR WHERE PROVIDER_ID = ?");
    $stmtMax->execute([$providerId]);
    $maxResult = $stmtMax->fetch();
    $nextDoctorNum = ($maxResult['maxNum'] ?? 0) + 1;

    foreach ($doctors as $index => $doctor) {
        $doctorName = $doctor['name'] ?? '';
        $doctorSpecialty = $doctor['specialty'] ?? '';

        if (!$doctorName || !$doctorSpecialty) {
            continue; // Skip empty entries
        }

        // Check if this exact doctor already exists (prevent exact duplicates)
        $stmtDocCheck = $pdo->prepare("SELECT DOCTOR_NUM FROM DOCTOR WHERE PROVIDER_ID = ? AND DOCTOR_NAME = ? AND SPECIALITY = ?");
        $stmtDocCheck->execute([$providerId, $doctorName, $doctorSpecialty]);
        
        if (!$stmtDocCheck->fetch()) {
            // Insert new doctor with sequential DOCTOR_NUM
            $stmtDoc = $pdo->prepare("
                INSERT INTO DOCTOR (PROVIDER_ID, DOCTOR_NUM, DOCTOR_NAME, SPECIALITY)
                VALUES (?, ?, ?, ?)
            ");
            $stmtDoc->execute([$providerId, $nextDoctorNum, $doctorName, $doctorSpecialty]);
            $nextDoctorNum++;
        }
    }

    // 6. Insert Donation Record
    $stmtDonCheck = $pdo->prepare("SELECT * FROM PROVIDER_DONATION WHERE PROVIDER_ID = ? AND SERVICE_NAME = ?");
    $stmtDonCheck->execute([$providerId, $serviceName]);
    
    if (!$stmtDonCheck->fetch()) {
        $stmtDonation = $pdo->prepare("
            INSERT INTO PROVIDER_DONATION 
            (SERVICE_NAME, SERVICE_TYPE, COVERAGE_TYPE, VALUE, PROVIDER_ID)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmtDonation->execute([$serviceName, $serviceType, $coverageType, $serviceValue, $providerId]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'provider_id' => $providerId, 'message' => ($editProviderId ? 'Provider updated' : 'Provider registered') . ' successfully!']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>