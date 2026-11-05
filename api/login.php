<?php
require_once __DIR__ . '/bootstrap.php';
require_method('POST');

$body     = json_body();
$email    = strtolower(trim($body['email']    ?? ''));
$password = $body['password'] ?? '';

if (empty($email) || empty($password))
    json_response(['ok' => false, 'error' => 'Kinakailangan ang email at password.'], 400);

$db = db();

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Allow 5 attempts per IP per 15-minute window.
$ip      = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ip      = trim(explode(',', $ip)[0]);   // take first IP if behind a proxy
$window  = 15 * 60;                      // 15 minutes in seconds
$maxTries = 5;

// Count recent attempts from this IP
$countStmt = $db->prepare(
    "SELECT COUNT(*) FROM login_attempts
     WHERE ip = ? AND attempted_at >= DATE_SUB(NOW(), INTERVAL $window SECOND)"
);
$countStmt->execute([$ip]);
$attempts = (int) $countStmt->fetchColumn();

if ($attempts >= $maxTries) {
    // Find when the oldest attempt in the window will expire
    $oldestStmt = $db->prepare(
        "SELECT MIN(attempted_at) FROM login_attempts
         WHERE ip = ? AND attempted_at >= DATE_SUB(NOW(), INTERVAL $window SECOND)"
    );
    $oldestStmt->execute([$ip]);
    $oldest      = $oldestStmt->fetchColumn();
    $retryAfter  = max(0, $window - (time() - strtotime($oldest)));
    $mins        = (int) ceil($retryAfter / 60);

    http_response_code(429);
    header('Retry-After: ' . $retryAfter);
    echo json_encode([
        'ok'    => false,
        'error' => 'Masyadong maraming pagtatangka. Subukan muli pagkatapos ng ' . $mins . ' minuto.',
    ]);
    exit;
}

// ── Fetch user ────────────────────────────────────────────────────────────────
$stmt = $db->prepare(
    'SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.status,
            u.password_hash, u.barangay_id,
            b.name AS barangay_name, b.city AS barangay_city,
            u.avatar_path
     FROM   users u
     LEFT   JOIN barangays b ON b.id = u.barangay_id
     WHERE  u.email = ?
     LIMIT  1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

// ── Verify password ───────────────────────────────────────────────────────────
if (!$user || !password_verify($password, $user['password_hash'])) {
    // Record the failed attempt
    $db->prepare("INSERT INTO login_attempts (ip) VALUES (?)")->execute([$ip]);

    // Purge attempts older than the window to keep the table clean
    $db->prepare(
        "DELETE FROM login_attempts
         WHERE attempted_at < DATE_SUB(NOW(), INTERVAL $window SECOND)"
    )->execute();

    $remaining = max(0, $maxTries - $attempts - 1);
    $msg = 'Mali ang email o password.';
    if ($remaining <= 2 && $remaining > 0)
        $msg .= ' ' . $remaining . ' pagtatangka pa ang natitira.';
    elseif ($remaining === 0)
        $msg .= ' Naka-lock na ang iyong account sa loob ng 15 minuto.';

    json_response(['ok' => false, 'error' => $msg], 401);
}

if ($user['status'] === 'rejected')
    json_response(['ok' => false, 'error' => 'Tinanggihan ang iyong access. Makipag-ugnayan sa iyong administrator.'], 403);

// ── Successful login — clear attempts for this IP ─────────────────────────────
$db->prepare("DELETE FROM login_attempts WHERE ip = ?")->execute([$ip]);

// ── Sign in ───────────────────────────────────────────────────────────────────
sign_in((int) $user['id']);

unset($user['password_hash']);

json_response([
    'ok'   => true,
    'user' => $user,
]);
