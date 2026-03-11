<?php
require 'db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("
        SELECT
            mc.CASE_ID,
            mc.CASE_TITLE,
            mc.CASE_DESCRIPTION,
            mc.CASE_REQ_AMOUNT,
            mc.CASE_COLL_AMOUNT,
            mc.CASE_URGENCY,
            mc.CASE_TYPE,
            mc.CASE_STATUS,
            mc.CASE_CREATED_AT,
            p.PAT_CITY, -- Keep original name for clarity
            tc.SPECIALTY 
        FROM MEDICAL_CASE mc
        JOIN PATIENT p ON mc.PATIENT_ID = p.PATIENT_ID
        LEFT JOIN TREATMENT_CASE tc ON mc.CASE_ID = tc.CASE_ID 
        WHERE mc.CASE_STATUS = 'approved'
        ORDER BY mc.CASE_CREATED_AT DESC
    ");

    $cases = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // We keep the logic simple here and let JS handle the display
    echo json_encode(['cases' => $cases]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}