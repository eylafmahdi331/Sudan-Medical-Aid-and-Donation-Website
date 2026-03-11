<?php
require 'db.php';
header('Content-Type: application/json');

try {
    // Get total unique donors across all campaigns
    $donorsStmt = $pdo->query("
        SELECT COUNT(DISTINCT d.DONOR_ID) as total_donors
        FROM DONATION d
        JOIN CAMPAIGN_DONATION cd ON d.DONATION_ID = cd.DONATION_ID
        WHERE cd.CAMP_ID IN (SELECT CAMP_ID FROM CAMPAIGN WHERE CAMP_IS_ACTIVE = 1)
    ");
    
    $donorsResult = $donorsStmt->fetch(PDO::FETCH_ASSOC);
    $totalDonors = $donorsResult['total_donors'] ?? 0;
    
    echo json_encode([
        'total_donors' => intval($totalDonors),
        'success' => true
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'success' => false]);
}
?>
