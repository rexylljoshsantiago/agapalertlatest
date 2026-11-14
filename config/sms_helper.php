<?php

function agap_sms_config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $path = __DIR__ . '/sms.php';
        $cfg  = is_file($path) ? require $path : [];
    }
    return is_array($cfg) ? $cfg : [];
}

function agap_normalize_ph_mobile(?string $raw): ?string
{
    if ($raw === null || $raw === '') return null;
    $digits = preg_replace('/\D+/', '', $raw);
    if ($digits === '') return null;
    if (str_starts_with($digits, '63') && strlen($digits) === 12) return $digits;
    if (str_starts_with($digits, '0')  && strlen($digits) === 11) return '63' . substr($digits, 1);
    if (strlen($digits) === 10 && str_starts_with($digits, '9'))  return '63' . $digits;
    return null;
}

/**
 * Send an SMS blast to all active users with valid phone numbers.
 * @return array{sent: int, failed: int, skipped: bool, reason: ?string}
 */
function agap_send_sms_bulk(PDO $db, string $message): array
{
    $cfg = agap_sms_config();
    if (empty($cfg['enabled']) || empty($cfg['api_key'])) {
        return ['sent' => 0, 'failed' => 0, 'skipped' => true, 'reason' => 'SMS not configured'];
    }

    $message = trim($message);
    if ($message === '') {
        return ['sent' => 0, 'failed' => 0, 'skipped' => true, 'reason' => 'Empty message'];
    }
    if (strlen($message) > 480) {
        $message = substr($message, 0, 477) . '...';
    }

    $stmt = $db->query(
        'SELECT phone_number FROM users
         WHERE status = "active"
           AND phone_number IS NOT NULL AND phone_number != ""'
    );
    $numbers = [];
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $phone) {
        $n = agap_normalize_ph_mobile((string) $phone);
        if ($n !== null) $numbers[$n] = true;
    }
    $numbers = array_keys($numbers);
    if ($numbers === []) {
        return ['sent' => 0, 'failed' => 0, 'skipped' => true, 'reason' => 'No valid phone numbers'];
    }

    $sender = preg_replace('/[^A-Za-z0-9]/', '', (string) ($cfg['sender'] ?? 'AGAPAlert')) ?: 'AGAPAlert';

    $sent   = 0;
    $failed = 0;

    foreach (array_chunk($numbers, 100) as $chunk) {
        $payload = http_build_query([
            'apikey'     => $cfg['api_key'],
            'number'     => implode(',', $chunk),
            'message'    => $message,
            'sendername' => $sender,
        ]);
        $ctx  = stream_context_create(['http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => $payload,
            'timeout' => 25,
        ]]);
        $body = @file_get_contents('https://api.semaphore.co/api/v4/messages', false, $ctx);
        if ($body === false) { $failed += count($chunk); continue; }
        $decoded = json_decode($body, true);
        if (!is_array($decoded)) { $failed += count($chunk); continue; }
        foreach ($decoded as $item) {
            if (!is_array($item)) continue;
            $s = strtolower((string) ($item['status'] ?? ''));
            if ($s === 'failed' || $s === 'refunded') $failed++; else $sent++;
        }
    }

    return ['sent' => $sent, 'failed' => $failed, 'skipped' => false, 'reason' => null];
}

/**
 * Count registered users and SMS-capable numbers.
 */
function agap_alert_recipient_count(PDO $db): array
{
    $stmt = $db->query(
        'SELECT phone_number FROM users
         WHERE status = "active"
           AND phone_number IS NOT NULL AND phone_number != ""'
    );
    $phones = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $phone) {
        if (agap_normalize_ph_mobile((string) $phone) !== null) $phones++;
    }

    $users = (int) $db->query(
        'SELECT COUNT(*) FROM users WHERE status = "active"'
    )->fetchColumn();

    $cfg = agap_sms_config();

    return [
        'registered'  => $users,
        'sms_capable' => $phones,
        'sms_enabled' => !empty($cfg['enabled']) && !empty($cfg['api_key']),
    ];
}
