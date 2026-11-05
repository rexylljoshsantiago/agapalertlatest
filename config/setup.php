<?php
/**
 * config/setup.php
 *
 * Run this ONCE from the browser: http://localhost/agapalert/config/setup.php
 * It creates the database, all tables, and the default admin account.
 * DELETE this file after running it (or it will be blocked by .htaccess).
 */

define('DB_HOST',    'localhost');
define('DB_USER',    'root');
define('DB_PASS',    '');
define('DB_NAME',    'agapalert');
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=' . DB_CHARSET,
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create database
    $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '`
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('USE `' . DB_NAME . '`');
    echo "✓ Database created or already exists.\n";

    // Run schema file
    $sql = file_get_contents(__DIR__ . '/../database.sql');

    // Strip the CREATE DATABASE / USE lines
    $sql = preg_replace('/CREATE DATABASE.*?;/si', '', $sql);
    $sql = preg_replace('/USE\s+\w+\s*;/i', '', $sql);

    // Split and run each statement
    $statements = array_filter(
        array_map('trim', explode(';', $sql)),
        fn($s) => $s !== ''
    );

    foreach ($statements as $stmt) {
        if (str_starts_with(ltrim($stmt), '--')) continue;
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            // Skip "already exists" errors on re-run
            if ($e->getCode() !== '42S01') throw $e;
        }
    }
    echo "✓ Tables created.\n";

    // Create default admin account
    $adminEmail    = 'admin@agapalert.ph';
    $adminPassword = 'admin123';
    $adminHash     = password_hash($adminPassword, PASSWORD_BCRYPT, ['cost' => 12]);

    $check = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $check->execute([$adminEmail]);

    if ($check->fetch()) {
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?')
            ->execute([$adminHash, $adminEmail]);
        echo "✓ Admin password reset.\n";
    } else {
        $pdo->prepare(
            'INSERT INTO users (full_name, email, password_hash, role, status)
             VALUES (?, ?, ?, "admin", "active")'
        )->execute(['System Administrator', $adminEmail, $adminHash]);
        echo "✓ Admin account created.\n";
    }

    echo "\n✅ Setup complete!\n";
    echo "   Email:    " . $adminEmail . "\n";
    echo "   Password: " . $adminPassword . "\n\n";
    echo "⚠️  Change the admin password after logging in.\n";
    echo "⚠️  Delete this file or block it via .htaccess after setup.\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
