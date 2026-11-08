<?php
/**
 * api/flood.php
 * GET  — current flood alert level; ?reach=1 adds Dalongue recipient stats (officials/admin)
 * POST — set level (0-3), optional SMS to registered residents when level >= 1
 */
require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/../config/sms_helper.php';
require_auth();

$db     = db();
$method = $_SERVER['REQUEST_METHOD'];
$cfg    = agap_sms_config();
$brgyId = (int) ($cfg['barangay_id'] ?? 1);

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if (isset($_GET['reach']) && (int) $_GET['reach'] === 1) {
        $user = current_user();
        if (!in_array($user['role'], ['official', 'admin'], true)) {
            json_response(['ok' => false, 'error' => 'Hindi awtorisado.'], 403);
        }
        $stats = agap_alert_recipient_count($db, $brgyId);
        json_response(['ok' => true, 'reach' => $stats]);
    }

    $row = $db->query(
        "SELECT level, wind_kmh, rain_mmh, notes, created_at
         FROM   flood_levels
         ORDER  BY created_at DESC
         LIMIT  1"
    )->fetch();

    if (!$row) {
        json_response([
            'ok'    => true,
            'flood' => [
                'level' => 0, 'wind_kmh' => 0, 'rain_mmh' => 0,
                'notes' => '', 'created_at' => null,
            ],
        ]);
    }

    json_response(['ok' => true, 'flood' => $row]);
}

// ── POST — set new level (officials + admin only) ─────────────────────────────
if ($method === 'POST') {
    $user = current_user();
    if (!in_array($user['role'], ['official', 'admin'], true)) {
        json_response(['ok' => false, 'error' => 'Hindi awtorisado.'], 403);
    }

    $body      = json_body();
    $level     = (int)   ($body['level']      ?? 0);
    $wind      = (float) ($body['wind_kmh']   ?? 0);
    $rain      = (float) ($body['rain_mmh']   ?? 0);
    $notes     = trim($body['notes'] ?? '');
    $notifySms = !empty($body['notify_sms']);

    if ($level < 0 || $level > 3) {
        json_response(['ok' => false, 'error' => 'Ang antas ay dapat 0–3.'], 400);
    }

    $prev = $db->query(
        'SELECT level FROM flood_levels ORDER BY created_at DESC LIMIT 1'
    )->fetch();
    $prevLevel = $prev ? (int) $prev['level'] : null;

    $smsSent = 0;
    $smsNote = null;

    $shouldSms = $notifySms || ($level >= 1 && ($prevLevel === null || $prevLevel !== $level));
    if ($shouldSms && $level >= 1) {
        $labels  = ['Normal', 'Bantay', 'Babala', 'Kritikal'];
        $label   = $labels[$level] ?? 'Alerto';
        $detail  = $notes !== '' ? $notes : 'Suriin ang AGAP Alert para sa mga hakbang.';
        $smsBody = 'AGAP ALERT Dalongue: Antas ' . $level . ' (' . $label . '). ' . $detail
            . ' MDRRMO (075)518-2024';

        $result  = agap_send_sms_bulk($db, $brgyId, $smsBody);
        $smsSent = (int) $result['sent'];
        if (!empty($result['skipped'])) {
            $smsNote = $result['reason'];
        }
    }

    $db->prepare(
        'INSERT INTO flood_levels (level, wind_kmh, rain_mmh, notes)
         VALUES (?, ?, ?, ?)'
    )->execute([$level, $wind, $rain, $notes]);

    json_response([
        'ok'      => true,
        'message' => 'Antas ng baha na-update.',
        'sms'     => ['sent' => $smsSent, 'note' => $smsNote],
    ]);
}

json_response(['ok' => false, 'error' => 'Hindi pinapayagang paraan.'], 405);
