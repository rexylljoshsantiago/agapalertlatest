<?php
/**
 * api/admin/officials.php
 * GET  — list approved barangay officials
 * POST — revoke official access { user_id }
 */

require_once __DIR__ . '/../../api/bootstrap.php';

require_role('admin');
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $db->query(
        "SELECT id, fname, mname, lname,
                CONCAT(fname, IF(mname IS NOT NULL AND mname != '', CONCAT(' ', mname, ' '), ' '), lname) AS full_name,
                email, phone_number, avatar_path, invite_code, created_at
         FROM   users
         WHERE  role = 'official' AND status = 'active'
         ORDER  BY lname ASC, fname ASC"
    )->fetchAll();

    json_response(['ok' => true, 'officials' => $rows]);
}

// ── POST — revoke ─────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $body   = json_body();
    $userId = (int) ($body['user_id'] ?? 0);

    if ($userId < 1)
        json_response(['ok' => false, 'error' => 'Invalid user_id.'], 400);

    $db->prepare(
        "UPDATE users SET role = 'resident', status = 'active'
         WHERE  id = ? AND role = 'official'"
    )->execute([$userId]);

    json_response(['ok' => true, 'message' => 'Official access revoked.']);
}

json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);
