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

$orgName = $_POST['orgName'] ?? '';
$orgType = $_POST['orgType'] ?? '';
$orgNum  = $_POST['orgNum'] ?? '';
$title   = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$targetAmount = $_POST['targetAmount'] ?? 0;
$targetPeople = $_POST['targetPeople'] ?? 0;
$startDate = $_POST['startDate'] ?? '';
$endDate   = $_POST['endDate'] ?? '';
$eventsJson = $_POST['events'] ?? '[]';

$events = json_decode($eventsJson, true) ?? [];
$eventCount = count($events);

if (!$orgName || !$orgType || !$orgNum || !$title) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    // Get organization
    $stmt = $pdo->prepare("SELECT ORG_ID, ORG_NAME, ORG_TYPE FROM ORGANIZATION WHERE ORG_NO = ?");
    $stmt->execute([$orgNum]);
    $org = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$org) {
        echo json_encode(['error' => 'Organization not found']);
        exit;
    }

    if ($org['ORG_NAME'] !== $orgName || $org['ORG_TYPE'] !== $orgType) {
        echo json_encode(['error' => 'Organization details mismatch']);
        exit;
    }

    $orgId = $org['ORG_ID'];

    // Insert campaign
    $stmt = $pdo->prepare("
        INSERT INTO CAMPAIGN 
        (CAMP_TITLE, CAMP_DESCRIPTION, NUM_PEOPLE, TARGET_AMOUNT, START_DATE, END_DATE, ORG_ID)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $title,
        $description,
        $targetPeople,
        $targetAmount,
        $startDate,
        $endDate,
        $orgId
    ]);

    $campaignId = $pdo->lastInsertId();

    // Insert events (EVENT_ID per campaign + EVENT_COUNT)
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
                $campaignId,
                $eventCount
            ]);
            $eventId++;
        }
    }

    echo json_encode([
        'success' => true,
        'campaign_id' => $campaignId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
