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
        "SELECT u.id, u.full_name, u.email, u.phone_number, u.status,
                b.name AS barangay_name, b.city AS barangay_city, u.created_at
         FROM   users u
         LEFT   JOIN barangays b ON b.id = u.barangay_id
         WHERE  u.role = 'official' AND u.status = 'pending'
         ORDER  BY u.created_at ASC"
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
