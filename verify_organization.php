<?php
session_start();
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$orgName = $_POST['orgName'] ?? '';
$orgType = $_POST['orgType'] ?? '';
$orgNum = $_POST['orgNum'] ?? '';

if (!$orgName || !$orgType || !$orgNum) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

try {
    // Check if organization exists by registration number
    $stmt = $pdo->prepare("SELECT ORG_ID, ORG_NAME, ORG_TYPE FROM ORGANIZATION WHERE ORG_NO = ?");
    $stmt->execute([$orgNum]);
    $org = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($org) {
        // Org exists - verify type and name match
        if ($org['ORG_TYPE'] !== $orgType) {
            echo json_encode([
                'verified' => false,
                'error' => 'Organization type does not match. Expected: ' . $org['ORG_TYPE'] . ', Got: ' . $orgType
            ]);
        } else if ($org['ORG_NAME'] !== $orgName) {
            echo json_encode([
                'verified' => false,
                'error' => 'Organization name does not match. Expected: ' . $org['ORG_NAME'] . ', Got: ' . $orgName
            ]);
        } else {
            echo json_encode([
                'verified' => true,
                'message' => 'Organization verified successfully',
                'org_id' => $org['ORG_ID'],
                'org_name' => $org['ORG_NAME']
            ]);
        }
    } else {
        // Org doesn't exist - ask if they want to register
        echo json_encode([
            'verified' => false,
            'error' => 'Organization not found in our partner database',
            'message' => 'This organization is not registered. Please contact us to register your organization first.',
            'register_needed' => true
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
