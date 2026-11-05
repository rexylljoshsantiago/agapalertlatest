<?php
/**
 * config/auth.php
 * Session helpers. Include this (along with db.php) in every API endpoint.
 */

require_once __DIR__ . '/db.php';

// Start session securely if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => false,   // Set to true when using HTTPS in production
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

/**
 * Return the currently signed-in user row, or null if not signed in.
 */
function current_user(): ?array {
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = db()->prepare(
        'SELECT id, full_name, email, phone_number, role, status,
                barangay_id, avatar_path, created_at
         FROM   users
         WHERE  id = ? AND status != "banned"
         LIMIT  1'
    );
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch() ?: null;
}

/**
 * Require the user to be signed in. Sends 401 and exits if not.
 */
function require_auth(): array {
    $user = current_user();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Not authenticated.']);
        exit;
    }
    return $user;
}

/**
 * Require the user to have a specific role.
 * Accepts a single role string or an array of allowed roles.
 */
function require_role(string|array $roles): array {
    $user = require_auth();
    $allowed = (array) $roles;
    if (!in_array($user['role'], $allowed, true)) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Access denied.']);
        exit;
    }
    return $user;
}

/**
 * Sign a user in by storing their ID in the session.
 */
function sign_in(int $userId): void {
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
}

/**
 * Sign the current user out.
 */
function sign_out(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600,
            $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

/**
 * Send a JSON response and exit.
 */
function json_response(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

/**
 * Only allow the given HTTP method(s). Sends 405 otherwise.
 */
function require_method(string|array $methods): void {
    $allowed = array_map('strtoupper', (array) $methods);
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowed, true)) {
        http_response_code(405);
        header('Allow: ' . implode(', ', $allowed));
        echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
        exit;
    }
}

/**
 * Get JSON body from the request.
 */
function json_body(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
