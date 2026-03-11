<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Login required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$campaign_id = intval($_POST['campaign_id'] ?? 0);
$title = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$targetAmount = floatval($_POST['targetAmount'] ?? 0);
$targetPeople = intval($_POST['targetPeople'] ?? 0);
$startDate = $_POST['startDate'] ?? '';
$endDate = $_POST['endDate'] ?? '';
$eventsJson = $_POST['events'] ?? '[]';

$events = json_decode($eventsJson, true) ?? [];
$eventCount = count($events);

if ($campaign_id <= 0 || !$title) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

try {
    // Update campaign
    $stmt = $pdo->prepare("
        UPDATE CAMPAIGN 
        SET CAMP_TITLE = ?, 
            CAMP_DESCRIPTION = ?, 
            NUM_PEOPLE = ?, 
            TARGET_AMOUNT = ?, 
            START_DATE = ?, 
            END_DATE = ?
        WHERE CAMP_ID = ?
    ");
    $stmt->execute([
        $title,
        $description,
        $targetPeople,
        $targetAmount,
        $startDate,
        $endDate,
        $campaign_id
    ]);

    // Delete old events
    $stmt = $pdo->prepare("DELETE FROM CAMPAIGN_EVENT WHERE CAMP_ID = ?");
    $stmt->execute([$campaign_id]);

    // Insert new events
    if ($eventCount > 0) {
        $stmt = $pdo->prepare("
            INSERT INTO CAMPAIGN_EVENT
            (EVENT_ID, EVENT_TITLE, EVENT_DATE, EVENT_LOCATION, CAMP_ID, EVENT_COUNT)
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $eventId = 1;

        foreach ($events as $event) {
            $stmt->execute([
                $eventId,
                $event['title'] ?? '',
                $event['date'] ?? null,
                $event['location'] ?? '',
                $campaign_id,
                $eventCount
            ]);
            $eventId++;
        }
    }

    echo json_encode(['success' => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
