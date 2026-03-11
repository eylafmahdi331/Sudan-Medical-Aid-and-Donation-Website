<?php
require 'db.php';
header('Content-Type: text/html');

// Create an admin user for testing
$adminEmail = 'admin@sudanaid.org';
$adminPassword = 'admin123';
$adminName = 'Admin User';

try {
    // Check if admin already exists
    $stmt = $pdo->prepare("SELECT USER_ID FROM USER WHERE USER_EMAIL = ?");
    $stmt->execute([$adminEmail]);
    
    if ($stmt->fetch()) {
        echo "<h2>Admin user already exists!</h2>";
        echo "<p>Email: $adminEmail</p>";
        echo "<p>Password: $adminPassword</p>";
    } else {
        // Create admin user
        $passwordHash = password_hash($adminPassword, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO USER (USER_FULL_NAME, USER_EMAIL, PASSWORD_HASH, ROLE) VALUES (?, ?, ?, 'admin')");
        $stmt->execute([$adminName, $adminEmail, $passwordHash]);
        
        echo "<h2>Admin user created successfully!</h2>";
        echo "<p>Email: $adminEmail</p>";
        echo "<p>Password: $adminPassword</p>";
    }
    
    echo "<hr>";
    echo "<h3>Next Steps:</h3>";
    echo "<ol>";
    echo "<li><a href='../pages/auth.html'>Login</a> with the admin credentials above</li>";
    echo "<li>Go to <a href='../pages/admin_providers.html'>Admin Providers Page</a></li>";
    echo "</ol>";
    
    echo "<hr>";
    echo "<h3>All Users:</h3>";
    echo "<table border='1' cellpadding='10'>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th></tr>";
    
    $stmt = $pdo->query("SELECT USER_ID, USER_FULL_NAME, USER_EMAIL, ROLE FROM USER");
    while ($row = $stmt->fetch()) {
        echo "<tr>";
        echo "<td>{$row['USER_ID']}</td>";
        echo "<td>{$row['USER_FULL_NAME']}</td>";
        echo "<td>{$row['USER_EMAIL']}</td>";
        echo "<td>{$row['ROLE']}</td>";
        echo "</tr>";
    }
    echo "</table>";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
