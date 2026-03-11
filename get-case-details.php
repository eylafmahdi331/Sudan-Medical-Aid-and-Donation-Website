<?php
require 'db.php';
header('Content-Type: application/json');

$case_id = intval($_GET['id'] ?? 0);

if ($case_id <= 0) {
    echo json_encode(['error' => 'Invalid case id']);
    exit;
}

try {
    // Fetch case info with patient location
    $stmt = $pdo->prepare("
        SELECT mc.*, p.PAT_CITY
        FROM MEDICAL_CASE mc
        LEFT JOIN PATIENT p ON mc.PATIENT_ID = p.PATIENT_ID
        WHERE mc.CASE_ID = ?
    ");
    $stmt->execute([$case_id]);
    $case_info = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$case_info) {
        echo json_encode(['error' => 'Case not found']);
        exit;
    }

    // Fetch donors - JOIN case_donation, donation, and donor tables
    $stmt = $pdo->prepare("
        SELECT 
            don.DONATION_AMOUNT,
            don.DONATION_DATE,
            don.IS_ANONYMOUS,
            d.DONOR_FIRST_NAME,
            d.DONOR_LAST_NAME
        FROM case_donation cd
        JOIN donation don ON cd.DONATION_ID = don.DONATION_ID
        LEFT JOIN donor d ON don.DONOR_ID = d.DONOR_ID
        WHERE cd.CASE_ID = ?
        ORDER BY don.DONATION_DATE DESC
    ");
    $stmt->execute([$case_id]);
    $donors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch case updates
    $stmt = $pdo->prepare("SELECT UPDATE_CONTENT, UPDATE_DATE FROM CASE_UPDATE WHERE CASE_ID = ? ORDER BY UPDATE_DATE DESC");
    $stmt->execute([$case_id]);
    $updates = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch case image and convert to web-accessible URL (or use default)
    $stmt = $pdo->prepare("SELECT FILE_PATH FROM MEDICAL_FILE WHERE CASE_ID = ? LIMIT 1");
    $stmt->execute([$case_id]);
    $file = $stmt->fetch(PDO::FETCH_ASSOC);

    // Base URL path for site (adjust if your app is served from a different subpath)
    $siteBase = '/sudan-medical-aid/sudan-medical-aid';
    // Use a local default image to avoid external 404s and ensure consistent availability
    $defaultImage = rtrim($siteBase, '/') . '/assets/case-1.jpg';

    $image_url = $defaultImage;
    if ($file && !empty($file['FILE_PATH'])) {
        $p = str_replace('\\', '/', $file['FILE_PATH']);
        // Remove any leading ../ or ./ segments
        $p = preg_replace('#^(\./|\.\./)+#', '', $p);
        // If path now starts with 'uploads' or '/uploads', ensure proper absolute path
        if (strpos($p, 'uploads/') === 0 || strpos($p, '/uploads/') === 0) {
            $p = rtrim($siteBase, '/') . '/' . ltrim($p, '/');
            $image_url = $p;
        } else if (strpos($p, '/') === 0) {
            // absolute path already
            $image_url = $p;
        } else {
            // fallback: prepend site base
            $image_url = rtrim($siteBase, '/') . '/' . $p;
        }
    }

    echo json_encode([
        'case_info' => $case_info,
        'donors' => $donors,
        'updates' => $updates,
        'image' => $image_url
    ]);

} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}