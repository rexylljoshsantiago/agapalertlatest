<?php
/**
 * api/shelters.php
 * GET — returns all open shelters with live occupancy from the database.
 */
require_once __DIR__ . '/bootstrap.php';
require_auth();
require_method('GET');

$rows = db()->query(
    "SELECT id, name, zone, landmark, capacity, occupancy, contact, is_open
     FROM   shelters
     WHERE  is_open = 1
     ORDER  BY id ASC"
)->fetchAll();

json_response(['ok' => true, 'shelters' => $rows]);
