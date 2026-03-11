<?php
require 'db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("
        SELECT 
            PROVIDER_ID,
            NAME, 
            TYPE, 
            CITY,
            EMAIL,
            DOCTOR_NAME,
            SPECIALTY, 
            STATUS,
            CREATED_AT
        FROM MEDICAL_PROVIDER 
        WHERE STATUS = 'pending'
        ORDER BY CREATED_AT ASC
    ");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['providers' => $providers]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
