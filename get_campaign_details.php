<?php
require 'db.php';
header('Content-Type: application/json');

$campaign_id = intval($_GET['id'] ?? 0);

if ($campaign_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid campaign ID']);
    exit;
}

try {
    // Fetch campaign details
    $stmt = $pdo->prepare("
        SELECT 
            c.CAMP_ID, c.CAMP_TITLE, c.CAMP_DESCRIPTION, c.NUM_PEOPLE, c.TARGET_AMOUNT,
            c.START_DATE, c.END_DATE, c.CAMP_IS_ACTIVE, c.ORG_ID,
            o.ORG_NAME, o.ORG_TYPE, o.ORG_INFO
        FROM CAMPAIGN c
        LEFT JOIN ORGANIZATION o ON c.ORG_ID = o.ORG_ID
        WHERE c.CAMP_ID = ?
    ");
    $stmt->execute([$campaign_id]);
    $campaign = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$campaign) {
        http_response_code(404);
        echo json_encode(['error' => 'Campaign not found']);
        exit;
    }

    // Get total raised from CAMPAIGN_DONATION joined with DONATION
    try {
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(d.DONATION_AMOUNT), 0) as total_raised, 
                COUNT(DISTINCT d.DONOR_ID) as donor_count 
            FROM CAMPAIGN_DONATION cd
            JOIN DONATION d ON cd.DONATION_ID = d.DONATION_ID
            WHERE cd.CAMP_ID = ?
        ");
        $stmt->execute([$campaign_id]);
        $donations = $stmt->fetch(PDO::FETCH_ASSOC);
        $campaign['RAISED_AMOUNT'] = floatval($donations['total_raised']);
        $campaign['DONOR_COUNT'] = intval($donations['donor_count']);
    } catch (PDOException $e) {
        $campaign['RAISED_AMOUNT'] = 0;
        $campaign['DONOR_COUNT'] = 0;
    }

    // Fetch events for this campaign
    $stmt = $pdo->prepare("
        SELECT EVENT_ID, EVENT_TITLE, EVENT_DATE, EVENT_LOCATION
        FROM CAMPAIGN_EVENT
        WHERE CAMP_ID = ?
        ORDER BY EVENT_DATE ASC
    ");
    $stmt->execute([$campaign_id]);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $campaign['events'] = $events;

    // Fetch donors for this campaign
    $donors = [];
    try {
        $stmt = $pdo->prepare("
            SELECT d.DONATION_AMOUNT, d.DONATION_DATE, d.IS_ANONYMOUS, donor.DONOR_FIRST_NAME, donor.DONOR_LAST_NAME
            FROM CAMPAIGN_DONATION cd
            JOIN DONATION d ON cd.DONATION_ID = d.DONATION_ID
            LEFT JOIN DONOR donor ON d.DONOR_ID = donor.DONOR_ID
            WHERE cd.CAMP_ID = ?
            ORDER BY d.DONATION_DATE DESC
            LIMIT 50
        ");
        $stmt->execute([$campaign_id]);
        $donors = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Table might not exist, that's ok
    }

    echo json_encode([
        'campaign' => $campaign,
        'donors' => $donors
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
