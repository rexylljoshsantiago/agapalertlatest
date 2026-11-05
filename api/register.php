<?php
require_once __DIR__ . '/bootstrap.php';
require_method('POST');

$body = json_body();

//  Input 
$full_name   = trim($body['full_name']   ?? '');
$phone       = trim($body['phone_number'] ?? '');
$email       = strtolower(trim($body['email'] ?? ''));
$barangay_id = 1;
$password    = $body['password'] ?? '';
$invite_code = strtoupper(trim($body['invite_code'] ?? ''));

// Validate
$errors = [];

if (mb_strlen($full_name) < 2 || mb_strlen($full_name) > 160)
    $errors['full_name'] = 'Enter your full name.';

if (empty($phone) || !preg_match('/^[0-9+()\-\s]{7,40}$/', $phone))
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

// Validate invite code (optional) 
$codeRow    = null;
$role       = 'resident';
$status     = 'active';

if (!empty($invite_code)) {
    $stmt = $db->prepare(
        "SELECT id FROM invite_codes WHERE code = ? AND status = 'unused' LIMIT 1"
    );
    $stmt->execute([$invite_code]);
    $codeRow = $stmt->fetch();

    if (!$codeRow)
        json_response(['ok' => false, 'errors' => ['invite_code' => 'Invalid or already used invite code.']], 422);

    $role   = 'official';
    $status = 'pending';
}

// Create user 
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$stmt = $db->prepare(
    'INSERT INTO users (full_name, email, phone_number, password_hash, role, status, barangay_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
$stmt->execute([
    $full_name,
    $email ?: null,
    $phone,
    $hash,
    $role,
    $status,
    $barangay_id,
]);
$userId = (int) $db->lastInsertId();

// Mark invite code used 
if ($codeRow) {
    $db->prepare(
        "UPDATE invite_codes SET status = 'used', used_by = ? WHERE id = ?"
    )->execute([$userId, $codeRow['id']]);
}

// Sign in immediately 
sign_in($userId);

// Return user (no password) 
$user = $db->prepare(
    'SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.status,
            u.barangay_id, b.name AS barangay_name, b.city AS barangay_city,
            u.avatar_path, u.created_at
     FROM   users u
     LEFT   JOIN barangays b ON b.id = u.barangay_id
     WHERE  u.id = ?'
);
$user->execute([$userId]);

json_response([
    'ok'      => true,
    'message' => $role === 'official'
        ? 'Account created. Your official access is under review.'
        : 'Account created. Welcome to AgapAlert.',
    'user'    => $user->fetch(),
]);
