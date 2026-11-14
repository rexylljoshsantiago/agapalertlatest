<?php
/**
 * api/admin/pending.php
 * GET  — list pending official requests
 * POST — approve or reject { user_id, action: "approve"|"reject" }
 */

require_once __DIR__ . '/../../api/bootstrap.php';

$admin  = require_role('admin');
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $db->query(
        "SELECT id, fname, mname, lname,
                CONCAT(fname, IF(mname IS NOT NULL AND mname != '', CONCAT(' ', mname, ' '), ' '), lname) AS full_name,
                email, phone_number, status, invite_code, created_at
         FROM   users
         WHERE  role = 'official' AND status = 'pending'
         ORDER  BY created_at ASC"
    )->fetchAll();

    json_response(['ok' => true, 'pending' => $rows]);
}

// ── POST — approve or reject ──────────────────────────────────────────────────
if ($method === 'POST') {
    $body    = json_body();
    $userId  = (int) ($body['user_id'] ?? 0);
    $action  = $body['action'] ?? '';

    if (!in_array($action, ['approve', 'reject'], true) || $userId < 1)
        json_response(['ok' => false, 'error' => 'Invalid request.'], 400);

    if ($action === 'approve') {
        $db->prepare(
            "UPDATE users SET status = 'active' WHERE id = ? AND role = 'official' AND status = 'pending'"
        )->execute([$userId]);
        json_response(['ok' => true, 'message' => 'Official access granted.']);
    }

    // reject
    $db->prepare(
        "UPDATE users SET status = 'rejected' WHERE id = ? AND status = 'pending'"
    )->execute([$userId]);
    json_response(['ok' => true, 'message' => 'Request rejected.']);
}

json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);
