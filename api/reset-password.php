<?php
/**
 * POST /api/reset-password.php
 * Body: { "phone": "09XXXXXXXXX", "otp": "123456", "password": "newpass" }
 *
 * Verifies the OTP and updates the user's password.
 */
require_once __DIR__ . '/bootstrap.php';
require_method('POST');

$body     = json_body();
$phone    = trim($body['phone']    ?? '');
$otp      = trim($body['otp']      ?? '');
$password = $body['password']      ?? '';

if ($phone === '' || $otp === '' || $password === '') {
    json_response(['ok' => false, 'error' => 'Kinakailangan ang lahat ng field.'], 400);
}

if (strlen($password) < 8) {
    json_response(['ok' => false, 'error' => 'Ang password ay dapat hindi bababa sa 8 character.'], 400);
}

require_once __DIR__ . '/../config/sms_helper.php';
$normalized = agap_normalize_ph_mobile($phone);
if ($normalized === null) {
    json_response(['ok' => false, 'error' => 'Hindi wastong numero ng telepono.'], 400);
}

$db = db();

// ── Find user ─────────────────────────────────────────────────────────────────
$local = '0' . substr($normalized, 2);
$stmt  = $db->prepare(
    "SELECT id FROM users
     WHERE REGEXP_REPLACE(phone_number, '[^0-9]', '') IN (?, ?)
     AND status = 'active'
     LIMIT 1"
);
$stmt->execute([$normalized, $local]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['ok' => false, 'error' => 'Hindi nahanap ang account.'], 404);
}

// ── Fetch latest unused, non-expired OTP ──────────────────────────────────────
$codeStmt = $db->prepare(
    "SELECT id, code_hash FROM password_resets
     WHERE user_id = ? AND used = 0 AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1"
);
$codeStmt->execute([$user['id']]);
$row = $codeStmt->fetch();

if (!$row || !password_verify($otp, $row['code_hash'])) {
    json_response(['ok' => false, 'error' => 'Mali o nag-expire na ang verification code.'], 400);
}

// ── Mark code as used ─────────────────────────────────────────────────────────
$db->prepare("UPDATE password_resets SET used = 1 WHERE id = ?")
   ->execute([$row['id']]);

// ── Update password ───────────────────────────────────────────────────────────
$newHash = password_hash($password, PASSWORD_DEFAULT);
$db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")
   ->execute([$newHash, $user['id']]);

json_response(['ok' => true, 'message' => 'Na-reset na ang iyong password.']);
