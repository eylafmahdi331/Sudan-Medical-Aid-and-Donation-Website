<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Login required']);
    exit;
}

$camp_id = intval($_POST['camp_id'] ?? 0);
if ($camp_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid campaign ID']);
    exit;
}

// Optional: check if user owns this campaign

$stmt = $pdo->prepare("UPDATE CAMPAIGN SET CAMP_IS_ACTIVE = 0 WHERE CAMP_ID = ?");
$stmt->execute([$camp_id]);

echo json_encode(['message' => 'Campaign removed successfully']);