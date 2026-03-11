<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Get DONATION table structure
    $stmt = $pdo->query("DESCRIBE DONATION");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['columns' => $columns]);
    
} catch(Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
