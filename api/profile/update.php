<?php
/**
 * api/profile/update.php
 * POST — updates the signed-in user's personal information.
 */

require_once __DIR__ . '/../../api/bootstrap.php';
require_method('POST');

$me   = require_auth();
$body = json_body();
$db   = db();

$full_name   = trim($body['full_name']    ?? '');
$phone       = trim($body['phone_number'] ?? '');
$email       = strtolower(trim($body['email'] ?? ''));
$barangay_id = 1;

$errors = [];

if (mb_strlen($full_name) < 2)
    $errors['full_name'] = 'Enter your full name.';

if (!empty($phone) && !preg_match('/^[0-9+()\-\s]{7,40}$/', $phone))
    $errors['phone_number'] = 'Mobile number looks invalid.';

if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL))
    $errors['email'] = 'Email address looks invalid.';


// Check email uniqueness (exclude current user)
if (!empty($email)) {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
    $stmt->execute([$email, $me['id']]);
    if ($stmt->fetch())
        $errors['email'] = 'This email is already in use.';
}

if (!empty($errors))
    json_response(['ok' => false, 'errors' => $errors], 422);

$db->prepare(
    'UPDATE users SET full_name = ?, email = ?, phone_number = ?, barangay_id = ?
     WHERE  id = ?'
)->execute([
    $full_name,
    $email ?: null,
    $phone ?: null,
    $barangay_id,
    $me['id'],
]);

// Return updated user
$stmt = $db->prepare(
    'SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.status,
            u.barangay_id, b.name AS barangay_name, b.city AS barangay_city,
            u.avatar_path
     FROM   users u
     LEFT   JOIN barangays b ON b.id = u.barangay_id
     WHERE  u.id = ?'
);
$stmt->execute([$me['id']]);

json_response(['ok' => true, 'user' => $stmt->fetch()]);
