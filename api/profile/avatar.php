<?php
/**
 * api/profile/avatar.php
 * POST (multipart/form-data) — uploads a profile photo.
 * DELETE — removes the current avatar.
 */

require_once __DIR__ . '/../../api/bootstrap.php';

$me = require_auth();

// ── DELETE — remove avatar ─────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if ($me['avatar_path']) {
        $full = __DIR__ . '/../../' . $me['avatar_path'];
        if (file_exists($full)) unlink($full);
    }
    db()->prepare('UPDATE users SET avatar_path = NULL WHERE id = ?')
        ->execute([$me['id']]);
    json_response(['ok' => true]);
}

// ── POST — upload avatar ──────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST')
    json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);

if (empty($_FILES['avatar']))
    json_response(['ok' => false, 'error' => 'No file uploaded.'], 400);

$file    = $_FILES['avatar'];
$maxSize = 4 * 1024 * 1024; // 4 MB

if ($file['error'] !== UPLOAD_ERR_OK)
    json_response(['ok' => false, 'error' => 'Upload failed.'], 400);

if ($file['size'] > $maxSize)
    json_response(['ok' => false, 'error' => 'Image must be under 4 MB.'], 400);

// Validate MIME type from file content (not extension)
$finfo    = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
$allowed  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

if (!in_array($mimeType, $allowed, true))
    json_response(['ok' => false, 'error' => 'Only JPEG, PNG, WebP and GIF images are allowed.'], 400);

$ext       = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'][$mimeType];
$filename  = 'avatar_' . $me['id'] . '_' . time() . '.' . $ext;
$uploadDir = __DIR__ . '/../../uploads/avatars/';
$destPath  = $uploadDir . $filename;

// Delete old avatar
if ($me['avatar_path']) {
    $old = __DIR__ . '/../../' . $me['avatar_path'];
    if (file_exists($old)) unlink($old);
}

if (!move_uploaded_file($file['tmp_name'], $destPath))
    json_response(['ok' => false, 'error' => 'Failed to save image.'], 500);

$relativePath = 'uploads/avatars/' . $filename;

db()->prepare('UPDATE users SET avatar_path = ? WHERE id = ?')
    ->execute([$relativePath, $me['id']]);

json_response(['ok' => true, 'avatar_path' => $relativePath]);
