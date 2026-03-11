<?php
require 'db.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query("SHOW COLUMNS FROM MEDICAL_FILE");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['columns' => $cols]);
} catch(Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>