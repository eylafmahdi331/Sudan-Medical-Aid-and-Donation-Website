<?php
session_start();
header('Content-Type: application/json');


// Suppress warnings/notices from breaking JSON
error_reporting(E_ERROR | E_PARSE);


$user = [
'id' => $_SESSION['user_id'] ?? null,
'name' => $_SESSION['user_name'] ?? '',
'role' => $_SESSION['user_role'] ?? 'user'
];


if ($user['id']) {
echo json_encode([
'authenticated' => true,
'user' => $user
]);
} else {
echo json_encode(['authenticated' => false]);
}