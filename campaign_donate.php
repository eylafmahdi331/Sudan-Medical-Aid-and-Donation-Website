<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$campaign_id = intval($_POST['campaign_id'] ?? 0);
$donor_name = $_POST['donor_name'] ?? '';
$donor_email = $_POST['donor_email'] ?? '';
$amount = floatval($_POST['amount'] ?? 0);

// Validate inputs
if ($campaign_id <= 0 || !$donor_name || !$donor_email || $amount <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input data']);
    exit;
}

try {
    // Check if campaign exists
    $stmt = $pdo->prepare("SELECT CAMP_ID FROM CAMPAIGN WHERE CAMP_ID = ? AND CAMP_IS_ACTIVE = 1");
    $stmt->execute([$campaign_id]);
    
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Campaign not found']);
        exit;
    }

    // Insert donation (assuming table exists with DONOR_ID, AMOUNT, DONATION_DATE, CAMPAIGN_ID, DONOR_NAME, DONOR_EMAIL)
    $stmt = $pdo->prepare("
        INSERT INTO CAMPAIGN_DONATION (CAMP_ID, DONOR_NAME, DONOR_EMAIL, AMOUNT, DONATION_DATE)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$campaign_id, $donor_name, $donor_email, $amount]);

    echo json_encode([
        'message' => 'Donation submitted successfully',
        'donation_id' => $pdo->lastInsertId()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
