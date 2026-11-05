<?php
header('Content-Type: application/json; charset=utf-8');

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
