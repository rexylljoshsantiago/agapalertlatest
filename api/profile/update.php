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

$fname = trim($body['fname'] ?? '');
$mname = trim($body['mname'] ?? '');
$lname = trim($body['lname'] ?? '');
$phone = trim($body['phone_number'] ?? '');
$email = strtolower(trim($body['email'] ?? ''));

$errors = [];

if (mb_strlen($fname) < 1 || mb_strlen($fname) > 50)
    $errors['fname'] = 'Enter your first name.';
if (mb_strlen($lname) < 1 || mb_strlen($lname) > 50)
    $errors['lname'] = 'Enter your last name.';
if (!empty($mname) && mb_strlen($mname) > 50)
    $errors['mname'] = 'Middle name is too long.';
if (!empty($phone) && !preg_match('/^[0-9+()\-\s]{7,15}$/', $phone))
    $errors['phone_number'] = 'Mobile number looks invalid.';
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL))
    $errors['email'] = 'Email address looks invalid.';

if (!empty($email)) {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
    $stmt->execute([$email, $me['id']]);
    if ($stmt->fetch())
        $errors['email'] = 'This email is already in use.';
}

if (!empty($errors))
    json_response(['ok' => false, 'errors' => $errors], 422);

$db->prepare(
    'UPDATE users SET fname = ?, mname = ?, lname = ?, email = ?, phone_number = ? WHERE id = ?'
)->execute([
    $fname,
    $mname ?: null,
    $lname,
    $email ?: null,
    $phone ?: null,
    $me['id'],
]);

$stmt = $db->prepare(
    'SELECT id, fname, mname, lname,
            CONCAT(fname, IF(mname IS NOT NULL AND mname != "", CONCAT(" ", mname, " "), " "), lname) AS full_name,
            email, phone_number, role, status, avatar_path, invite_code, created_at
     FROM   users WHERE id = ?'
);
$stmt->execute([$me['id']]);

json_response(['ok' => true, 'user' => $stmt->fetch()]);
