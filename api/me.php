<?php
require_once __DIR__ . '/bootstrap.php';
require_method('GET');

$rawUser = current_user();

if (!$rawUser)
    json_response(['ok' => false, 'error' => 'Not authenticated.'], 401);

// Fetch full row with barangay join
$stmt = db()->prepare(
    'SELECT id, fname, mname, lname,
            CONCAT(fname, IF(mname IS NOT NULL AND mname != "", CONCAT(" ", mname, " "), " "), lname) AS full_name,
            email, phone_number, role, status, avatar_path, invite_code, created_at
     FROM   users
     WHERE  id = ?'
);
$stmt->execute([$rawUser['id']]);
$user = $stmt->fetch();

json_response(['ok' => true, 'user' => $user]);
