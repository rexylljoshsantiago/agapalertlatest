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
        "SELECT u.id, u.full_name, u.email, u.phone_number,
                b.name AS barangay_name, b.city AS barangay_city,
                u.avatar_path, u.created_at
         FROM   users u
         LEFT   JOIN barangays b ON b.id = u.barangay_id
         WHERE  u.role = 'official' AND u.status = 'active'
         ORDER  BY u.full_name ASC"
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
