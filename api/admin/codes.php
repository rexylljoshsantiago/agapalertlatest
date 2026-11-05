<?php
/**
 * api/admin/codes.php
 * GET    — list all invite codes
 * POST   — generate a new invite code
 * DELETE ?id= — expire (revoke) a code
 */

require_once __DIR__ . '/../../api/bootstrap.php';

$admin = require_role('admin');
$db    = db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET — list codes ──────────────────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $db->query(
        'SELECT ic.id, ic.code, ic.note, ic.status, ic.created_at,
                u.full_name AS used_by_name
         FROM   invite_codes ic
         LEFT   JOIN users u ON u.id = ic.used_by
         ORDER  BY ic.created_at DESC'
    )->fetchAll();

    json_response(['ok' => true, 'codes' => $rows]);
}

// ── POST — generate code ──────────────────────────────────────────────────────
if ($method === 'POST') {
    $body = json_body();
    $note = trim($body['note'] ?? '');

    // Generate unique code
    do {
        $code = 'BRGY-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4))
                        . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 4));
        $exists = $db->prepare('SELECT id FROM invite_codes WHERE code = ? LIMIT 1');
        $exists->execute([$code]);
    } while ($exists->fetch());

    $db->prepare(
        'INSERT INTO invite_codes (code, note, created_by) VALUES (?, ?, ?)'
    )->execute([$code, $note ?: null, $admin['id']]);

    json_response(['ok' => true, 'code' => $code]);
}

// ── DELETE — revoke code ──────────────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    $stmt = $db->prepare(
        "UPDATE invite_codes SET status = 'expired'
         WHERE  id = ? AND status = 'unused'"
    );
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0)
        json_response(['ok' => false, 'error' => 'Code not found or already used.'], 404);

    json_response(['ok' => true]);
}

json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);
