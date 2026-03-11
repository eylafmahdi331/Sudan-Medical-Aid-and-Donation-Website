<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$id = $_POST['id'] ?? '';
$action = $_POST['action'] ?? '';

if (!$id || !in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid parameters. Require id and action (approve/reject)']);
    exit;
}

try {
    $status = $action === 'approve' ? 'approved' : 'rejected';
    
    $stmt = $pdo->prepare("UPDATE MEDICAL_PROVIDER SET STATUS = ? WHERE PROVIDER_ID = ?");
    $stmt->execute([$status, $id]);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true, 'message' => "Provider $status successfully"]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Provider not found or already in that status']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
