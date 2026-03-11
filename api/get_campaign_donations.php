<?php
require 'db.php';
header('Content-Type: application/json');

$campaign_id = intval($_GET['id'] ?? 0);

if ($campaign_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid campaign ID']);
    exit;
}

try {
    // Get total donations for this campaign
    $stmt = $pdo->prepare("
        SELECT 
            SUM(AMOUNT) as total_raised,
            COUNT(*) as donor_count
        FROM CAMPAIGN_DONATION
        WHERE CAMP_ID = ?
    ");
    $stmt->execute([$campaign_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'campaign_id' => $campaign_id,
        'total_raised' => floatval($result['total_raised'] ?? 0),
        'donor_count' => intval($result['donor_count'] ?? 0)
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
