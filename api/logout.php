<?php
require_once __DIR__ . '/bootstrap.php';
require_method('POST');

sign_out();

json_response(['ok' => true, 'message' => 'Signed out.']);
