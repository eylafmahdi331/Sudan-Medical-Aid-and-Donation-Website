<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Login required']);
    exit;
}

$camp_id = intval($_GET['camp_id'] ?? 0);
if ($camp_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid campaign ID']);
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM CAMPAIGN WHERE CAMP_ID = ? AND CAMP_IS_ACTIVE = 1");
$stmt->execute([$camp_id]);
$campaign = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$campaign) {
    http_response_code(404);
    echo json_encode(['error' => 'Campaign not found']);
    exit;
}

echo json_encode($campaign);