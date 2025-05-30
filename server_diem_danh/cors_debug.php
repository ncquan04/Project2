<?php
// cors_debug.php
require_once __DIR__ . '/modules/CORS.php';

// Enable CORS
CORS::enableCORS();

// Return detailed debug information
header('Content-Type: application/json');

echo json_encode([
    'status' => 'success',
    'message' => 'CORS is working correctly',
    'debug' => [
        'origin' => isset(\['HTTP_ORIGIN']) ? \['HTTP_ORIGIN'] : 'No origin header',
        'method' => \['REQUEST_METHOD'],
        'headers' => getallheaders(),
        'time' => date('Y-m-d H:i:s')
    ]
]);
?>
