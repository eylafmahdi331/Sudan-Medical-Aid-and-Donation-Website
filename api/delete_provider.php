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
$providerId = $_GET['id'] ?? null;

if (!$providerId) {
    http_response_code(400);
    echo json_encode(['error'=>'Provider ID required']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Ensure the provider belongs to the logged-in user (if applicable)
    // For now, we'll allow deletion if the provider exists

    // Delete associated records
    $pdo->prepare("DELETE FROM CASE_PROVIDER WHERE PROVIDER_ID=?")->execute([$providerId]);
    $pdo->prepare("DELETE FROM DOCTOR WHERE PROVIDER_ID=?")->execute([$providerId]);
    $pdo->prepare("DELETE FROM PROVIDER_DONATION WHERE PROVIDER_ID=?")->execute([$providerId]);
    $pdo->prepare("DELETE FROM MEDICAL_PROVIDER WHERE PROVIDER_ID=?")->execute([$providerId]);

    $pdo->commit();
    echo json_encode(['success'=>true]);

} catch(Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['error'=>$e->getMessage()]);
}
?>