<?php
session_start();
require 'db.php'; // PDO connection
header('Content-Type: application/json');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Login required']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Check if user exists
    $stmt = $pdo->prepare("SELECT USER_ID FROM `USER` WHERE USER_ID = ?");
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) throw new Exception("Invalid user session");

    $data = $_POST;

    // Normalize boolean fields coming from the form (could be '1'/'0' or absent)
    $requiresHospitalization = isset($data['REQUIRES_HOSPITALIZATION']) && ($data['REQUIRES_HOSPITALIZATION'] === '1' || $data['REQUIRES_HOSPITALIZATION'] === 1 || $data['REQUIRES_HOSPITALIZATION'] === 'on');
    $hasPrescription = isset($data['HAS_PRESCRIPTION']) && ($data['HAS_PRESCRIPTION'] === '1' || $data['HAS_PRESCRIPTION'] === 1 || $data['HAS_PRESCRIPTION'] === 'on');

    // Cast back to int values for DB inserts
    $requiresHospitalInt = $requiresHospitalization ? 1 : 0;
    $hasPrescriptionInt = $hasPrescription ? 1 : 0;

    // Validate required fields
    $requiredFields = ['CASE_REQ_AMOUNT','CASE_TITLE','CASE_DESCRIPTION','CASE_TYPE','CASE_URGENCY','PAT_FNAME','PAT_LNAME','PAT_AGE','PAT_CITY','PAT_GENDER','PAT_PHONE_NO'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) throw new Exception("Missing required field: $field");
    }

    $requiredAmount = (int)$data['CASE_REQ_AMOUNT'];
    if ($requiredAmount < 50000) throw new Exception("Required amount must be at least 50,000 SDG");

    $pdo->beginTransaction();

    $editCaseId = !empty($data['editCaseId']) ? (int)$data['editCaseId'] : null;
    $isForSelf = !empty($data['IS_FOR_SELF']);

    // Get existing patient ID if editing
    $existingPatientId = null;
    if ($editCaseId) {
        $stmt = $pdo->prepare("SELECT PATIENT_ID FROM MEDICAL_CASE WHERE CASE_ID = ?");
        $stmt->execute([$editCaseId]);
        $existingCase = $stmt->fetch();
        if ($existingCase) $existingPatientId = $existingCase['PATIENT_ID'];
    }

    // ----------------------------
    // PATIENT HANDLING
    // ----------------------------


// ----------------------------
// PATIENT HANDLING
// ----------------------------
if ($isForSelf) {

    // ===== SELF (IS_FOR_SELF = 1) =====
    $stmt = $pdo->prepare(
      "SELECT PATIENT_ID FROM PATIENT WHERE USER_ID = ? AND IS_FOR_SELF = ?"
    );
    $stmt->execute([$userId, 1]);
    $existingPatient = $stmt->fetch();

    if ($existingPatient) {
        // Update existing self patient
        $patientId = $existingPatient['PATIENT_ID'];
        $stmt = $pdo->prepare(
          "UPDATE PATIENT 
           SET PAT_FNAME=?, PAT_LNAME=?, PAT_AGE=?, PAT_CITY=?, 
               PAT_GENDER=?, PAT_EMAIL=?, PAT_PHONE_NO=? 
           WHERE PATIENT_ID=?"
        );
        $stmt->execute([
            $data['PAT_FNAME'],
            $data['PAT_LNAME'],
            $data['PAT_AGE'],
            $data['PAT_CITY'],
            $data['PAT_GENDER'],
            $data['PAT_EMAIL'] ?? null,
            $data['PAT_PHONE_NO'],
            $patientId
        ]);
    } else {
        // Insert self patient
        $stmt = $pdo->prepare(
          "INSERT INTO PATIENT 
          (USER_ID, PAT_FNAME, PAT_LNAME, PAT_AGE, PAT_CITY, 
           PAT_GENDER, PAT_EMAIL, PAT_PHONE_NO, IS_FOR_SELF)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId,
            $data['PAT_FNAME'],
            $data['PAT_LNAME'],
            $data['PAT_AGE'],
            $data['PAT_CITY'],
            $data['PAT_GENDER'],
            $data['PAT_EMAIL'] ?? null,
            $data['PAT_PHONE_NO'],
            1 // SELF
        ]);
        $patientId = $pdo->lastInsertId();
    }

} else {

    // ===== NOT SELF (IS_FOR_SELF = 0) =====
    if ($editCaseId && $existingPatientId) {
        // Update existing non-self patient
        $stmt = $pdo->prepare(
          "UPDATE PATIENT 
           SET PAT_FNAME=?, PAT_LNAME=?, PAT_AGE=?, PAT_CITY=?, 
               PAT_GENDER=?, PAT_EMAIL=?, PAT_PHONE_NO=? 
           WHERE PATIENT_ID=?"
        );
        $stmt->execute([
            $data['PAT_FNAME'],
            $data['PAT_LNAME'],
            $data['PAT_AGE'],
            $data['PAT_CITY'],
            $data['PAT_GENDER'],
            $data['PAT_EMAIL'] ?? null,
            $data['PAT_PHONE_NO'],
            $existingPatientId
        ]);
        $patientId = $existingPatientId;
    } else {
        // Insert new non-self patient
        $stmt = $pdo->prepare(
          "INSERT INTO PATIENT 
          (USER_ID, PAT_FNAME, PAT_LNAME, PAT_AGE, PAT_CITY, 
           PAT_GENDER, PAT_EMAIL, PAT_PHONE_NO, IS_FOR_SELF)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $userId,
            $data['PAT_FNAME'],
            $data['PAT_LNAME'],
            $data['PAT_AGE'],
            $data['PAT_CITY'],
            $data['PAT_GENDER'],
            $data['PAT_EMAIL'] ?? null,
            $data['PAT_PHONE_NO'],
            0 // NOT SELF
        ]);
        $patientId = $pdo->lastInsertId();
    }
}
    // ----------------------------
    // MEDICAL CASE HANDLING
    // ----------------------------
    if ($editCaseId) {
        // Update existing case
        $stmt = $pdo->prepare("UPDATE MEDICAL_CASE SET CASE_TITLE=?, CASE_DESCRIPTION=?, CASE_TYPE=?, CASE_URGENCY=?, CASE_REQ_AMOUNT=? WHERE CASE_ID=? AND PATIENT_ID=?");
        $stmt->execute([
            $data['CASE_TITLE'],
            $data['CASE_DESCRIPTION'],
            $data['CASE_TYPE'],
            $data['CASE_URGENCY'],
            $requiredAmount,
            $editCaseId,
            $patientId
        ]);
        $caseId = $editCaseId;

        // Remove old treatment/medication details
        $pdo->prepare("DELETE FROM TREATMENT_CASE WHERE CASE_ID=?")->execute([$caseId]);
        $pdo->prepare("DELETE FROM MEDICATION_CASE WHERE CASE_ID=?")->execute([$caseId]);
    } else {
        // Insert new case
        $stmt = $pdo->prepare("INSERT INTO MEDICAL_CASE (PATIENT_ID, CASE_TITLE, CASE_DESCRIPTION, CASE_TYPE, CASE_URGENCY, CASE_REQ_AMOUNT)
            VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $patientId,
            $data['CASE_TITLE'],
            $data['CASE_DESCRIPTION'],
            $data['CASE_TYPE'],
            $data['CASE_URGENCY'],
            $requiredAmount
        ]);
        $caseId = $pdo->lastInsertId();
    }

    // ----------------------------
    // TREATMENT / MEDICATION
    // ----------------------------
    if ($data['CASE_TYPE'] === 'treatment') {
        // If patient indicated prescription OR hospitalization, estimated duration is required
        if (($hasPrescription || $requiresHospitalization) && empty(trim($data['ESTIMATED_DURATION'] ?? ''))) {
            throw new Exception('Estimated duration is required when prescription or hospitalization is selected');
        }

        $stmt = $pdo->prepare("INSERT INTO TREATMENT_CASE (CASE_ID, TREATMENT_TYPE, SPECIALTY, REQUIRES_HOSPITALIZATION, ESTIMATED_DURATION)
                               VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $caseId,
            $data['TREATMENT_TYPE'] ?? null,
            $data['SPECIALTY'] ?? null,
            $requiresHospitalInt,
            $data['ESTIMATED_DURATION'] ?? null
        ]);
    } elseif ($data['CASE_TYPE'] === 'medication') {
        // If patient indicated prescription OR hospitalization, duration AND hospital name are required
        if (($hasPrescription || $requiresHospitalization)) {
            if (empty(trim($data['DURATION'] ?? ''))) throw new Exception('Duration is required when prescription or hospitalization is selected');
            if (empty(trim($data['HOSPITAL_NAME'] ?? ''))) throw new Exception('Hospital name is required when prescription or hospitalization is selected');
        }

        $stmt = $pdo->prepare("INSERT INTO MEDICATION_CASE (CASE_ID, MEDICATION_NAME, DOSAGE, DURATION, HAS_PRESCRIPTION, HOSPITAL_NAME)
                               VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $caseId,
            $data['MEDICATION_NAME'] ?? null,
            $data['DOSAGE'] ?? null,
            $data['DURATION'] ?? null,
            $hasPrescriptionInt,
            $data['HOSPITAL_NAME'] ?? null
        ]);
    }

   // ----------------------------
// FILE UPLOADS (CASE_FILE_COUNT)
// ----------------------------
if (!empty($_FILES['files']['name'][0])) {

    $uploadDir = '../uploads/cases/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $maxFiles = 4;
    $maxSize = 10 * 1024 * 1024;

    // Get existing number of files for this case
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM MEDICAL_FILE WHERE CASE_ID = ?");
    $stmt->execute([$caseId]);
    $existingCount = (int)$stmt->fetchColumn();

    $validUploads = [];

    // Validate uploaded files
    foreach ($_FILES['files']['tmp_name'] as $key => $tmpName) {
        if ($existingCount + count($validUploads) >= $maxFiles) break;
        if ($_FILES['files']['error'][$key] !== UPLOAD_ERR_OK) continue;
        if ($_FILES['files']['size'][$key] > $maxSize) continue;

        $validUploads[] = $key;
    }

    $fileNo = $existingCount + 1;

    // Insert each valid file into MEDICAL_FILE (no FILE_COUNT column)
    $stmt = $pdo->prepare(
        "INSERT INTO MEDICAL_FILE
        (CASE_ID, FILE_NO, FILE_NAME, FILE_PATH, FILE_TYPE)
        VALUES (?, ?, ?, ?, ?)"
    );

    foreach ($validUploads as $key) {
        $fileName = basename($_FILES['files']['name'][$key]);
        $fileType = pathinfo($fileName, PATHINFO_EXTENSION);
        $filePath = $uploadDir . uniqid() . '_' . $fileName;

        if (move_uploaded_file($_FILES['files']['tmp_name'][$key], $filePath)) {
            $stmt->execute([
                $caseId,
                $fileNo,
                $fileName,
                $filePath,
                $fileType
            ]);
            $fileNo++;
        }
    }

    // Update CASE_FILE_COUNT table
    $finalFileCount = $existingCount + count($validUploads);

    // Check if a row already exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM CASE_FILE_COUNT WHERE CASE_ID = ?");
    $stmt->execute([$caseId]);
    $exists = (int)$stmt->fetchColumn();

    if ($exists) {
        // Update existing row
        $stmt = $pdo->prepare("UPDATE CASE_FILE_COUNT SET FILE_COUNT = ? WHERE CASE_ID = ?");
        $stmt->execute([$finalFileCount, $caseId]);
    } else {
        // Insert new row
        $stmt = $pdo->prepare("INSERT INTO CASE_FILE_COUNT (CASE_ID, FILE_COUNT) VALUES (?, ?)");
        $stmt->execute([$caseId, $finalFileCount]);
    }
}

    $pdo->commit();
    echo json_encode(['success'=>true,'case_id'=>$caseId]);

} catch(Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log($e->getMessage());
    http_response_code(400);
    echo json_encode(['error'=>$e->getMessage()]);
}

?>