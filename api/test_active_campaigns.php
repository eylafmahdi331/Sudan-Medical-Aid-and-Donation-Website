<?php
header('Content-Type: application/json');
require 'db.php';

try {
    // Test 1: Check if CAMPAIGN table exists and has data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM CAMPAIGN");
    $totalCampaigns = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Test 2: Check active campaigns
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM CAMPAIGN WHERE CAMP_IS_ACTIVE = 1");
    $activeCampaigns = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Test 3: Get sample active campaigns
    $stmt = $pdo->query("
        SELECT 
            CAMP_ID, CAMP_TITLE, CAMP_DESCRIPTION, NUM_PEOPLE, 
            TARGET_AMOUNT, START_DATE, END_DATE, CAMP_IS_ACTIVE, ORG_ID
        FROM CAMPAIGN 
        WHERE CAMP_IS_ACTIVE = 1 
        LIMIT 5
    ");
    $samples = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 4: Check ORGANIZATION table
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM ORGANIZATION");
    $totalOrgs = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // Test 5: Get sample organizations
    $stmt = $pdo->query("SELECT ORG_ID, ORG_NAME, ORG_TYPE FROM ORGANIZATION LIMIT 5");
    $orgs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Test 6: Now test the fetch_campaigns endpoint to ensure it works
    echo json_encode([
        'database_check' => [
            'total_campaigns' => $totalCampaigns,
            'active_campaigns' => $activeCampaigns,
            'total_organizations' => $totalOrgs
        ],
        'sample_campaigns' => $samples,
        'sample_organizations' => $orgs,
        'api_test' => 'Visit /api/fetch_campaigns.php to test campaign loading',
        'instructions' => [
            'If active_campaigns = 0, you need to create campaigns first',
            'Go to create-campaign.html to create campaigns',
            'Make sure organizations exist in database first'
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode([
        'error' => $e->getMessage(),
        'status' => 'Database connection failed'
    ]);
}
?>
