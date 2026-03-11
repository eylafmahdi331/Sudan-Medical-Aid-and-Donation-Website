<?php
require 'db.php';
header('Content-Type: application/json');

// Test with case ID 1
$case_id = 1;

try {
    // Check if case exists
    $stmt = $pdo->prepare("SELECT CASE_ID, CASE_TITLE FROM MEDICAL_CASE WHERE CASE_ID = ?");
    $stmt->execute([$case_id]);
    $case = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$case) {
        echo json_encode(['error' => 'Case not found', 'case_id' => $case_id]);
        exit;
    }
    
    echo json_encode(['success' => 'Case found', 'case' => $case]);
    
} catch(Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
