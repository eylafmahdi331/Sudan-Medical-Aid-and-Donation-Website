<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Check if CAMPAIGN table exists and has data
    $result = $pdo->query("SELECT COUNT(*) as count FROM CAMPAIGN");
    $campaignCount = $result->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Get all campaigns with details
    $stmt = $pdo->query("
        SELECT 
            c.CAMP_ID,
            c.CAMP_TITLE,
            c.CAMP_DESCRIPTION,
            c.NUM_PEOPLE,
            c.TARGET_AMOUNT,
            c.START_DATE,
            c.END_DATE,
            c.CAMP_IS_ACTIVE,
            o.ORG_NAME,
            COALESCE(SUM(cd.AMOUNT), 0) as RAISED_AMOUNT,
            COUNT(DISTINCT cd.DONATION_ID) as DONOR_COUNT
        FROM CAMPAIGN c
        LEFT JOIN ORGANIZATION o ON c.ORG_ID = o.ORG_ID
        LEFT JOIN CAMPAIGN_DONATION cd ON c.CAMP_ID = cd.CAMP_ID
        GROUP BY c.CAMP_ID
        LIMIT 5
    ");
    
    $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get organizations
    $orgs = $pdo->query("SELECT * FROM ORGANIZATION LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'campaign_count' => intval($campaignCount),
        'campaigns' => $campaigns,
        'organizations' => $orgs,
        'message' => 'Database check successful'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
