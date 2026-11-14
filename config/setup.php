<?php
/**
 * config/setup.php
 * Run once from browser: http://localhost/agapalert/config/setup.php
 * Creates the database, all tables, seeds data, and the default admin account.
 * DELETE this file after running it.
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

    $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '`
                CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $pdo->exec('USE `' . DB_NAME . '`');
    echo "✓ Database created or already exists.\n";

    $sql = file_get_contents(__DIR__ . '/../database.sql');
    // Strip CREATE DATABASE / USE statements
    $sql = preg_replace('/CREATE DATABASE.*?;/si', '', $sql);
    $sql = preg_replace('/USE\s+\w+\s*;/i', '', $sql);

    // Split on DELIMITER blocks so stored procedures are handled correctly
    $parts      = preg_split('/(DELIMITER\s+\S+)/i', $sql, -1, PREG_SPLIT_DELIM_CAPTURE);
    $statements = [];
    $delim      = ';';

    foreach ($parts as $part) {
        if (preg_match('/^DELIMITER\s+(\S+)$/i', trim($part), $m)) {
            $delim = $m[1];
            continue;
        }
        foreach (array_filter(array_map('trim', explode($delim, $part))) as $s) {
            if ($s !== '' && !preg_match('/^--/', ltrim($s))) {
                $statements[] = $s;
            }
        }
        $delim = ';';
    }

    foreach ($statements as $stmt) {
        if (preg_match('/^--/', ltrim($stmt))) continue;
        try {
            $pdo->exec($stmt);
        } catch (PDOException $e) {
            if (!in_array($e->getCode(), ['42S01', '42S21', '42000'], true)) throw $e;
        }
    }
    echo "✓ Tables and procedures created.\n";

    // Create / reset default admin account
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
            'INSERT INTO users (fname, lname, email, password_hash, role, status)
             VALUES (?, ?, ?, ?, "admin", "active")'
        )->execute(['System', 'Administrator', $adminEmail, $adminHash]);
        echo "✓ Admin account created.\n";
    }

    echo "\n✅ Setup complete!\n";
    echo "   Email:    " . $adminEmail . "\n";
    echo "   Password: " . $adminPassword . "\n\n";
    echo "⚠️  Change the admin password after logging in.\n";
    echo "⚠️  Delete this file after setup.\n";

} catch (PDOException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
