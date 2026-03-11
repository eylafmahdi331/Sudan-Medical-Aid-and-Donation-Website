<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Get case_donation table structure
    $stmt = $pdo->query("DESCRIBE case_donation");
    $case_donation = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get donor table structure
    $stmt = $pdo->query("DESCRIBE donor");
    $donor = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get donation table structure (again for full view)
    $stmt = $pdo->query("DESCRIBE donation");
    $donation = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'case_donation' => $case_donation,
        'donor' => $donor,
        'donation' => $donation
    ]);
    
} catch(Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
