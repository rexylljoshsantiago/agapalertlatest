<?php
/**
 * api/reports.php
 * GET   — list reports (paginated via ?page=N&limit=N)
 *         OR single report status via ?id=N
 * POST  — submit a new report or SOS
 * PATCH — update report status (officials only)
 */
require_once __DIR__ . '/bootstrap.php';
require_auth();

$user   = current_user();
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET single report by id (used for SOS status polling) ─────────────────────
if ($method === 'GET' && isset($_GET['id'])) {
    $id   = (int) $_GET['id'];
    $stmt = $db->prepare(
        "SELECT id, status FROM reports WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) json_response(['ok' => false, 'error' => 'Not found.'], 404);
    json_response(['ok' => true, 'report' => $row]);
}

$user   = current_user();
$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

// ── GET ───────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    $isOfficial = in_array($user['role'], ['official', 'admin'], true);

    $limit  = max(1, min(100, (int) ($_GET['limit'] ?? 30)));
    $page   = max(1, (int) ($_GET['page']  ?? 1));
    $offset = ($page - 1) * $limit;

    if ($isOfficial) {
        // Total count for pagination meta
        $total = (int) $db->query("SELECT COUNT(*) FROM reports")->fetchColumn();

        $stmt = $db->prepare(
            "SELECT r.id, r.title, r.description, r.zone, r.status, r.is_sos,
                    r.created_at,
                    CONCAT(u.fname, IF(u.mname IS NOT NULL AND u.mname != '', CONCAT(' ', u.mname, ' '), ' '), u.lname) AS reporter_name
             FROM   reports r
             LEFT   JOIN users u ON u.id = r.user_id
             ORDER  BY r.created_at DESC
             LIMIT  :lim OFFSET :off"
        );
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
    } else {
        // Residents only see non-SOS reports in their barangay
        $total = (int) $db->query("SELECT COUNT(*) FROM reports WHERE is_sos = 0")->fetchColumn();

        $stmt = $db->prepare(
            "SELECT r.id, r.title, r.description, r.zone, r.status, r.is_sos, r.created_at
             FROM   reports r
             WHERE  r.is_sos = 0
             ORDER  BY r.created_at DESC
             LIMIT  :lim OFFSET :off"
        );
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':off', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();
    }

    json_response([
        'ok'      => true,
        'reports' => $rows,
        'meta'    => [
            'total'    => (int) $total,
            'page'     => $page,
            'limit'    => $limit,
            'pages'    => (int) ceil($total / $limit),
        ],
    ]);
}

// ── POST — submit report / SOS ────────────────────────────────────────────────
if ($method === 'POST') {
    $body  = json_body();
    $title = trim($body['title'] ?? '');
    $desc  = trim($body['description'] ?? '');
    $zone  = trim($body['zone'] ?? $body['location'] ?? '');
    $isSOS = !empty($body['is_sos']) ? 1 : 0;

    if (mb_strlen($title) < 3)
        json_response(['ok' => false, 'error' => 'Ilarawan ang insidente.'], 422);

    $stmt = $db->prepare(
        "INSERT INTO reports (user_id, title, description, zone, is_sos)
         VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $user['id'],
        $title,
        $desc  ?: null,
        $zone  ?: null,
        $isSOS,
    ]);

    json_response([
        'ok'      => true,
        'message' => $isSOS
            ? 'SOS natanggap. Ang iyong barangay ay aabisuhan.'
            : 'Ulat naipadala.',
        'id'      => (int) $db->lastInsertId(),
    ]);
}

// ── PATCH — update status (officials only) ────────────────────────────────────
if ($method === 'PATCH') {
    if (!in_array($user['role'], ['official', 'admin'], true))
        json_response(['ok' => false, 'error' => 'Hindi awtorisado.'], 403);

    $body      = json_body();
    $reportId  = (int) ($body['id']     ?? 0);
    $newStatus = $body['status'] ?? '';

    $allowed = ['acknowledged', 'dispatched', 'resolved'];
    if ($reportId < 1 || !in_array($newStatus, $allowed, true))
        json_response(['ok' => false, 'error' => 'Maling kahilingan.'], 400);

    $db->prepare("UPDATE reports SET status = ? WHERE id = ?")
       ->execute([$newStatus, $reportId]);

    json_response(['ok' => true, 'message' => 'Status na-update.']);
}

json_response(['ok' => false, 'error' => 'Hindi pinapayagang paraan.'], 405);
