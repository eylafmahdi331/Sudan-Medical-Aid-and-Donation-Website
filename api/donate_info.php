<?php
session_start();
include 'db.php';
header('Content-Type: application/json');

// Get and clean inputs
$donationType = strtolower($_GET['type'] ?? 'general'); 
$rawID = $_GET['id'] ?? null;
// Clean the ID: removes [ ] or any non-numeric characters
$relatedID = preg_replace('/[^0-9]/', '', $rawID);

$title = "General Fund";

try {
    if ($donationType === 'case' && $relatedID) {
        $stmt = $pdo->prepare("SELECT CASE_TITLE FROM MEDICAL_CASE WHERE CASE_ID = ?");
        $stmt->execute([$relatedID]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) $title = $row['CASE_TITLE'];

    } elseif ($donationType === 'campaign' && $relatedID) {
        $stmt = $pdo->prepare("SELECT CAMP_TITLE FROM CAMPAIGN WHERE CAMP_ID = ?");
        $stmt->execute([$relatedID]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) $title = $row['CAMP_TITLE'];
    }

    echo json_encode([
        'donation_type' => $donationType,
        'related_id'    => $relatedID,
        'title'         => $title
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}