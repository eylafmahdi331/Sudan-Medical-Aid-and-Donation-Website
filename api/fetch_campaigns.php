<?php
require 'db.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query("
        SELECT
            c.CAMP_ID,
            c.CAMP_TITLE,
            c.CAMP_DESCRIPTION,
            c.NUM_PEOPLE,
            c.TARGET_AMOUNT,
            c.START_DATE,
            c.END_DATE,
            c.CAMP_IS_ACTIVE,
            c.ORG_ID,
            o.ORG_NAME,
            o.ORG_TYPE,
            COALESCE(SUM(d.DONATION_AMOUNT), 0) as RAISED_AMOUNT,
            CASE 
                WHEN c.TARGET_AMOUNT > 0 THEN (COALESCE(SUM(d.DONATION_AMOUNT), 0) / c.TARGET_AMOUNT) * 100
                ELSE 0
            END as percentage
        FROM CAMPAIGN c
        JOIN ORGANIZATION o ON c.ORG_ID = o.ORG_ID
        LEFT JOIN CAMPAIGN_DONATION cd ON c.CAMP_ID = cd.CAMP_ID
        LEFT JOIN DONATION d ON cd.DONATION_ID = d.DONATION_ID
        WHERE c.CAMP_IS_ACTIVE = 1
        GROUP BY c.CAMP_ID
        ORDER BY c.START_DATE DESC
    ");

    $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['campaigns' => $campaigns]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}