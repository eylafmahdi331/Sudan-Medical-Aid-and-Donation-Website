<?php
require 'db.php';
header('Content-Type: application/json');

// Check admin auth
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Admin access required']);
    exit;
}

try {
    // Get counts by status
    $stmt = $pdo->query("
        SELECT 
            SUM(CASE WHEN STATUS = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN STATUS = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN STATUS = 'rejected' THEN 1 ELSE 0 END) as rejected
        FROM MEDICAL_PROVIDER
    ");
    $stats = $stmt->fetch();
    
    echo json_encode(['stats' => $stats]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
