<?php
/**
 * api/admin/shelters.php
 * GET   — list all shelters
 * PATCH — update occupancy { id, occupancy }
 */
require_once __DIR__ . '/../../api/bootstrap.php';
require_role('admin');

$db     = db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $db->query(
        "SELECT s.id, s.name, s.capacity, s.occupancy, s.contact, s.is_open,
                b.name AS barangay_name
         FROM   shelters s
         LEFT   JOIN barangays b ON b.id = s.barangay_id
         WHERE  s.barangay_id = 1
         ORDER  BY s.id ASC"
    )->fetchAll();
    json_response(['ok' => true, 'shelters' => $rows]);
}

if ($method === 'PATCH') {
    $body      = json_body();
    $id        = (int)   ($body['id']        ?? 0);
    $occupancy = (int)   ($body['occupancy'] ?? 0);
    $isOpen    = isset($body['is_open']) ? (int) $body['is_open'] : null;

    if ($id < 1 || $occupancy < 0)
        json_response(['ok' => false, 'error' => 'Invalid data.'], 400);

    if ($isOpen !== null) {
        $db->prepare("UPDATE shelters SET occupancy = ?, is_open = ? WHERE id = ?")
           ->execute([$occupancy, $isOpen, $id]);
    } else {
        $db->prepare("UPDATE shelters SET occupancy = ? WHERE id = ?")
           ->execute([$occupancy, $id]);
    }

    json_response(['ok' => true, 'message' => 'Shelter na-update.']);
}

json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);
