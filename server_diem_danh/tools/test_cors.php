<?php
// tools/test_cors.php
require_once __DIR__ . '/../modules/CORS.php';

// Kích hoạt CORS
CORS::enableCORS();

// Trả về dữ liệu test
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true, 
    'message' => 'CORS test successful!',
    'server_time' => date('Y-m-d H:i:s'),
    'request_info' => [
        'Origin' => $_SERVER['HTTP_ORIGIN'] ?? 'Not set',
        'Method' => $_SERVER['REQUEST_METHOD'] ?? 'Not set',
        'URI' => $_SERVER['REQUEST_URI'] ?? 'Not set',
        'User-Agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Not set',
        'Headers' => getallheaders()
    ]
]);
?>