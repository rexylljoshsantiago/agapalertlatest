<?php
/**
 * POST /api/forgot-password.php
 * Body: { "phone": "09XXXXXXXXX" }
 *
 * Looks up the user by phone number, generates a 6-digit OTP,
 * stores it (hashed) in password_resets, and sends it via SMS.
 */
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../config/sms_helper.php';

require_method('POST');

$body  = json_body();
$phone = trim($body['phone'] ?? '');

if ($phone === '') {
    json_response(['ok' => false, 'error' => 'Kinakailangan ang numero ng telepono.'], 400);
}

$normalized = agap_normalize_ph_mobile($phone);
if ($normalized === null) {
    json_response(['ok' => false, 'error' => 'Hindi wastong numero ng telepono.'], 400);
}

$db = db();

// ── Find user ─────────────────────────────────────────────────────────────────
// Match against stored phone numbers (try both formats: 09XX and 639XX)
$stmt = $db->prepare(
    "SELECT id, CONCAT(fname, ' ', lname) AS full_name, phone_number FROM users
     WHERE REGEXP_REPLACE(phone_number, '[^0-9]', '') IN (?, ?)
     AND status = 'active'
     LIMIT 1"
);
$local   = '0' . substr($normalized, 2); // 639XX → 09XX
$stmt->execute([$normalized, $local]);
$user = $stmt->fetch();

// Always respond OK to avoid phone enumeration
if (!$user) {
    json_response(['ok' => true, 'message' => 'Kung naka-rehistro ang numero, makakatanggap ka ng OTP.']);
}

// ── Rate-limit: max 3 OTPs per phone per 10 minutes ───────────────────────────
$limitStmt = $db->prepare(
    "SELECT COUNT(*) FROM password_resets
     WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)"
);
$limitStmt->execute([$user['id']]);
if ((int) $limitStmt->fetchColumn() >= 3) {
    json_response(['ok' => false, 'error' => 'Masyadong maraming kahilingan. Subukan muli pagkatapos ng 10 minuto.'], 429);
}

// ── Generate OTP ──────────────────────────────────────────────────────────────
$otp     = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$hash    = password_hash($otp, PASSWORD_DEFAULT);
$expires = date('Y-m-d H:i:s', time() + 10 * 60); // 10 minutes

// Invalidate previous codes for this user
$db->prepare("UPDATE password_resets SET used = 1 WHERE user_id = ? AND used = 0")
   ->execute([$user['id']]);

// Store new code
$db->prepare(
    "INSERT INTO password_resets (user_id, code_hash, expires_at) VALUES (?, ?, ?)"
)->execute([$user['id'], $hash, $expires]);

// ── Send SMS ──────────────────────────────────────────────────────────────────
$cfg = agap_sms_config();
$message = "Ang iyong AGAP Alert verification code ay: $otp\nNag-e-expire ito sa loob ng 10 minuto. Huwag ibahagi ito sa iba.";

$smsSent = false;
if (!empty($cfg['enabled']) && !empty($cfg['api_key'])) {
    $sender  = preg_replace('/[^A-Za-z0-9]/', '', (string) ($cfg['sender'] ?? 'AGAPAlert')) ?: 'AGAPAlert';
    $payload = http_build_query([
        'apikey'     => $cfg['api_key'],
        'number'     => $normalized,
        'message'    => $message,
        'sendername' => $sender,
    ]);
    $ctx = stream_context_create([
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 20,
        ],
    ]);
    $result  = @file_get_contents('https://api.semaphore.co/api/v4/messages', false, $ctx);
    $smsSent = $result !== false;
}

json_response([
    'ok'      => true,
    'message' => 'Kung naka-rehistro ang numero, makakatanggap ka ng OTP.',
    'sms_sent' => $smsSent,
]);
