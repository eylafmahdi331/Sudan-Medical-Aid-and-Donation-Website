<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error'=>'Login required']);
    exit;
}

$userId = $_SESSION['user_id'];
$caseId = $_GET['id'] ?? null;

if (!$caseId) {
    http_response_code(400);
    echo json_encode(['error'=>'Case ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Ensure the case belongs to the logged-in user
    $stmt = $pdo->prepare("SELECT M.CASE_ID, P.PATIENT_ID FROM MEDICAL_CASE M
                           JOIN PATIENT P ON M.PATIENT_ID = P.PATIENT_ID
                           WHERE M.CASE_ID=? AND P.USER_ID=?");
    $stmt->execute([$caseId, $userId]);
    $case = $stmt->fetch();

    if (!$case) throw new Exception("Case not found or unauthorized");

    // Delete associated files
    $stmt = $pdo->prepare("SELECT FILE_PATH FROM MEDICAL_FILE WHERE CASE_ID=?");
    $stmt->execute([$caseId]);
    $files = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($files as $f) { if(file_exists($f)) unlink($f); }

    // Delete from related tables
    $pdo->prepare("DELETE FROM MEDICAL_FILE WHERE CASE_ID=?")->execute([$caseId]);
    $pdo->prepare("DELETE FROM TREATMENT_CASE WHERE CASE_ID=?")->execute([$caseId]);
    $pdo->prepare("DELETE FROM MEDICATION_CASE WHERE CASE_ID=?")->execute([$caseId]);
    $pdo->prepare("DELETE FROM MEDICAL_CASE WHERE CASE_ID=?")->execute([$caseId]);

    $pdo->commit();
    echo json_encode(['success'=>true]);

} catch(Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['error'=>$e->getMessage()]);
}
?>