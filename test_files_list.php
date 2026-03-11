<?php
require 'db.php';
header('Content-Type: application/json');
try {
    $stmt = $pdo->query("SELECT CASE_ID, FILE_NO, FILE_NAME, FILE_PATH, FILE_TYPE FROM MEDICAL_FILE ORDER BY CASE_ID DESC, FILE_NO DESC LIMIT 50");
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['files' => $files]);
} catch(Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>