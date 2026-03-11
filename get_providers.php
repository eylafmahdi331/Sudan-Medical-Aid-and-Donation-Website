<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Select using your EXACT schema column names
    $stmt = $pdo->query("
        SELECT 
            p.PROVIDER_ID,
            p.PROVIDER_NAME, 
            p.PROVIDER_TYPE, 
            p.PROVIDER_ADDRESS,
            d.SERVICE_NAME,
            (SELECT COUNT(*) FROM CASE_PROVIDER cp WHERE cp.PROVIDER_ID = p.PROVIDER_ID) as total_cases,
            (SELECT SUM(VALUE) FROM PROVIDER_DONATION pd WHERE pd.PROVIDER_ID = p.PROVIDER_ID) as total_value
        FROM MEDICAL_PROVIDER p
        LEFT JOIN PROVIDER_DONATION d ON p.PROVIDER_ID = d.PROVIDER_ID
        WHERE p.IS_ACTIVE = 1
        GROUP BY p.PROVIDER_ID
        ORDER BY p.PROV_CREATED_AT DESC
    ");
    
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['providers' => $providers]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}