<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Check CAMPAIGN table
    $stmt = $pdo->query("DESCRIBE CAMPAIGN");
    $campaign_cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check CAMPAIGN_DONATION table
    $donation_cols = [];
    try {
        $stmt = $pdo->query("DESCRIBE CAMPAIGN_DONATION");
        $donation_cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        $donation_cols = ['error' => 'Table does not exist'];
    }
    
    // Get sample data
    $stmt = $pdo->query("SELECT * FROM CAMPAIGN LIMIT 1");
    $sample_campaign = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'campaign_columns' => $campaign_cols,
        'campaign_donation_columns' => $donation_cols,
        'sample_campaign' => $sample_campaign
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
