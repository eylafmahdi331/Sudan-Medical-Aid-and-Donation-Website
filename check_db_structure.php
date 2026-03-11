<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

try {
    // Check CAMPAIGN_DONATION table structure
    $stmt = $pdo->query("DESCRIBE CAMPAIGN_DONATION");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also check CAMPAIGN table for active campaigns
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM CAMPAIGN WHERE CAMP_IS_ACTIVE = 1");
    $activeCampaigns = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get sample campaign
    $stmt = $pdo->query("SELECT * FROM CAMPAIGN LIMIT 1");
    $sampleCampaign = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get sample donation
    $stmt = $pdo->query("SELECT * FROM CAMPAIGN_DONATION LIMIT 1");
    $sampleDonation = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'campaign_donation_columns' => $columns,
        'active_campaigns_count' => $activeCampaigns['count'],
        'sample_campaign' => $sampleCampaign,
        'sample_donation' => $sampleDonation,
        'status' => 'Database structure check'
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
