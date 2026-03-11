<?php
require 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$firstName = trim($_POST['first_name'] ?? '');
$lastName = trim($_POST['last_name'] ?? '');
$fullName = trim($_POST['full_name'] ?? "$firstName $lastName");
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if (!$fullName || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

try {
    // Check if email exists
    $stmt = $pdo->prepare("SELECT USER_ID FROM USER WHERE USER_EMAIL = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }

    // Hash password
    $hash = password_hash($password, PASSWORD_BCRYPT);

    // Insert user
    $stmt = $pdo->prepare("INSERT INTO USER (USER_FULL_NAME, USER_EMAIL, PASSWORD_HASH) VALUES (?, ?, ?)");
    $stmt->execute([$fullName, $email, $hash]);
    $userId = $pdo->lastInsertId();

    // Insert into PATIENT table as well (Optional but good for consistency given schema)
    // Note: We might not have all patient details (age, city, phone) yet, so we can defer this or insert placeholders.
    // For now, let's just create the User account. The Patient record can be created when they first submit a case or update profile.

    echo json_encode(['message' => 'Signup successful']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
