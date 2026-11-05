<?php
/**
 * api/profile/password.php
 * POST — changes the signed-in user's password.
 */

require_once __DIR__ . '/../../api/bootstrap.php';
require_method('POST');

$me   = require_auth();
$body = json_body();

$newPassword     = $body['password']         ?? '';
$confirmPassword = $body['password_confirm'] ?? '';

if (strlen($newPassword) < 8)
    json_response(['ok' => false, 'errors' => ['password' => 'Password must be at least 8 characters.']], 422);

if ($newPassword !== $confirmPassword)
    json_response(['ok' => false, 'errors' => ['password_confirm' => 'Passwords do not match.']], 422);

$hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    ->execute([$hash, $me['id']]);

json_response(['ok' => true, 'message' => 'Password updated.']);
