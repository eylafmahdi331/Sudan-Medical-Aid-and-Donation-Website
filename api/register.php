<?php
require 'db.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$firstName = $_POST['first_name'] ?? '';
$lastName = $_POST['last_name'] ?? '';

if (!$email || !$password || !$firstName || !$lastName) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

$fullName = htmlspecialchars(trim("$firstName $lastName"));

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT USER_ID FROM USER WHERE USER_EMAIL = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Email already registered']);
        exit;
    }

    // Insert new user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO USER (USER_FULL_NAME, USER_EMAIL, PASSWORD_HASH) VALUES (?, ?, ?)");
    $stmt->execute([$fullName, $email, $passwordHash]);

    $userId = $pdo->lastInsertId();

    // Auto-login
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $fullName;

    echo json_encode(['message' => 'Registration successful']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
