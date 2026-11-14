<?php
/**
 * api/register.php
 * POST — create a new resident or official account.
 */
require_once __DIR__ . '/bootstrap.php';
require_method('POST');

$body        = json_body();
$fname       = trim($body['fname']        ?? '');
$mname       = trim($body['mname']        ?? '');
$lname       = trim($body['lname']        ?? '');
$phone       = trim($body['phone_number'] ?? '');
$email       = strtolower(trim($body['email']    ?? ''));
$password    = $body['password']    ?? '';
$invite_code = strtoupper(trim($body['invite_code'] ?? ''));

$errors = [];

if (mb_strlen($fname) < 1 || mb_strlen($fname) > 50)
    $errors['fname'] = 'Enter your first name.';
if (mb_strlen($lname) < 1 || mb_strlen($lname) > 50)
    $errors['lname'] = 'Enter your last name.';
if (!empty($mname) && mb_strlen($mname) > 50)
    $errors['mname'] = 'Middle name is too long.';
if (empty($phone) || !preg_match('/^[0-9+()\-\s]{7,15}$/', $phone))
    $errors['phone_number'] = 'Enter a valid mobile number.';
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL))
    $errors['email'] = 'Enter a valid email address.';
if (strlen($password) < 8)
    $errors['password'] = 'Password must be at least 8 characters.';
elseif (strlen($password) > 72)
    $errors['password'] = 'Password is too long.';

if (!empty($errors))
    json_response(['ok' => false, 'errors' => $errors], 422);

$db = db();

// Check email uniqueness
if (!empty($email)) {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $stmt->execute([$email]);
    if ($stmt->fetch())
        json_response(['ok' => false, 'errors' => ['email' => 'This email is already registered.']], 409);
}

// Validate invite code (optional — grants official role)
$codeRow = null;
$role    = 'resident';
$status  = 'active';

if (!empty($invite_code)) {
    $stmt = $db->prepare("SELECT id FROM invite_codes WHERE code = ? AND status = 'unused' LIMIT 1");
    $stmt->execute([$invite_code]);
    $codeRow = $stmt->fetch();
    if (!$codeRow)
        json_response(['ok' => false, 'errors' => ['invite_code' => 'Invalid or already used invite code.']], 422);
    $role   = 'official';
    $status = 'pending';
}

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$db->prepare(
    'INSERT INTO users (fname, mname, lname, email, phone_number, password_hash, role, status, invite_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $fname,
    $mname ?: null,
    $lname,
    $email ?: null,
    $phone,
    $hash,
    $role,
    $status,
    $codeRow ? $invite_code : null,
]);
$userId = (int) $db->lastInsertId();

// Mark invite code as used
if ($codeRow) {
    $db->prepare("UPDATE invite_codes SET status = 'used', used_by = ? WHERE id = ?")
       ->execute([$userId, $codeRow['id']]);
}

sign_in($userId);

$user = $db->prepare(
    'SELECT id, fname, mname, lname,
            CONCAT(fname, IF(mname IS NOT NULL AND mname != "", CONCAT(" ", mname, " "), " "), lname) AS full_name,
            email, phone_number, role, status, avatar_path, invite_code, created_at
     FROM   users WHERE id = ?'
);
$user->execute([$userId]);

json_response([
    'ok'      => true,
    'message' => $role === 'official'
        ? 'Account created. Your official access is under review.'
        : 'Account created. Welcome to AgapAlert.',
    'user'    => $user->fetch(),
]);
