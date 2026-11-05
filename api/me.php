<?php
require_once __DIR__ . '/bootstrap.php';
require_method('GET');

$rawUser = current_user();

if (!$rawUser)
    json_response(['ok' => false, 'error' => 'Not authenticated.'], 401);

// Fetch full row with barangay join
$stmt = db()->prepare(
    'SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.status,
            u.barangay_id, b.name AS barangay_name, b.city AS barangay_city,
            u.avatar_path, u.created_at
     FROM   users u
     LEFT   JOIN barangays b ON b.id = u.barangay_id
     WHERE  u.id = ?'
);
$stmt->execute([$rawUser['id']]);
$user = $stmt->fetch();

json_response(['ok' => true, 'user' => $user]);
