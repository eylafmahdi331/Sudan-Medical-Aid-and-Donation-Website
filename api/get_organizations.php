<?php
// Quick test to verify ORGANIZATION table has data
session_start();
require 'db.php';
header('Content-Type: application/json');

try {
    // Get all organizations
    $stmt = $pdo->query("SELECT ORG_ID, ORG_NAME, ORG_TYPE, ORG_NO FROM ORGANIZATION LIMIT 10");
    $organizations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'total_organizations' => count($organizations),
        'organizations' => $organizations,
        'message' => 'These are the organizations you can use to create campaigns'
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage(),
        'message' => 'ORGANIZATION table may not exist or there was a database error'
    ]);
}
?>
