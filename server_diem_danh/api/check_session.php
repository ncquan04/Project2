<?php
// api/check_session.php
require_once __DIR__ . '/utils.php';

// Kiểm tra trạng thái session
checkSessionAndRespond();

Response::json(["logged_in" => false]);