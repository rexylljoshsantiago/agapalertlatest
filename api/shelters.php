<?php
/**
 * api/shelters.php
 * GET — returns all open shelters with live occupancy from the database.
 */
require_once __DIR__ . '/bootstrap.php';
require_auth();
require_method('GET');

$rows = db()->query(
    "SELECT s.id, s.name, s.capacity, s.occupancy, s.contact, s.is_open,
            b.name AS barangay_name
     FROM   shelters s
     LEFT   JOIN barangays b ON b.id = s.barangay_id
     WHERE  s.is_open = 1 AND s.barangay_id = 1
     ORDER  BY s.id ASC"
)->fetchAll();

json_response(['ok' => true, 'shelters' => $rows]);
