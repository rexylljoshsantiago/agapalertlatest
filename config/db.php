<?php
/**
 * config/db.php
 * Returns a PDO connection. Call db() anywhere you need the database.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'agapalert');
define('DB_USER', 'root');
define('DB_PASS', '');          // Change this in production
define('DB_CHARSET', 'utf8mb4');

function db(): PDO {
    static $pdo = null;

    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST
             . ';dbname=' . DB_NAME
             . ';charset=' . DB_CHARSET;

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Don't leak connection details in production
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Database connection failed.']);
            exit;
        }
    }

    return $pdo;
}
