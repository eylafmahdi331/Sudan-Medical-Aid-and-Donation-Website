<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Fetches only the ID and Title for the dropdown (only approved/public cases)
    $stmt = $pdo->query("SELECT CASE_ID, CASE_TITLE FROM MEDICAL_CASE WHERE CASE_STATUS = 'approved' ORDER BY CASE_CREATED_AT DESC");
    $cases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If no cases in database, return sample cases for testing
    if (empty($cases)) {
        $cases = [
            ['CASE_ID' => 1, 'CASE_TITLE' => 'Emergency Heart Surgery for Ahmed'],
            ['CASE_ID' => 2, 'CASE_TITLE' => 'Cancer Treatment for Fatima'],
            ['CASE_ID' => 3, 'CASE_TITLE' => 'Diabetes Medication for Omar'],
            ['CASE_ID' => 4, 'CASE_TITLE' => 'Pediatric Care for Children']
        ];
    }

    echo json_encode(['cases' => $cases]);

} catch (PDOException $e) {
    // Return sample data on error for testing
    $cases = [
        ['CASE_ID' => 1, 'CASE_TITLE' => 'Emergency Heart Surgery for Ahmed'],
        ['CASE_ID' => 2, 'CASE_TITLE' => 'Cancer Treatment for Fatima']
    ];
    echo json_encode(['cases' => $cases]);
}