<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Get CAMPAIGN_DONATION columns
    $stmt = $pdo->query("DESCRIBE CAMPAIGN_DONATION");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample donation
    $stmt = $pdo->query("SELECT * FROM CAMPAIGN_DONATION LIMIT 1");
    $sample = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'columns' => $columns,
        'sample_donation' => $sample
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
