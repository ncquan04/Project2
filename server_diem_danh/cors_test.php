<?php
// Simple CORS test script
require_once __DIR__ . '/modules/CORS.php';

// Enable CORS
CORS::enableCORS();

// Show received headers for debugging
echo "Received headers:\n";
foreach (getallheaders() as $name => $value) {
    echo "$name: $value\n";
}

echo "\n\nAccess-Control headers sent:\n";
$headers_list = headers_list();
foreach ($headers_list as $header) {
    if (strpos($header, 'Access-Control') !== false) {
        echo "$header\n";
    }
}

// Output something
echo json_encode(['test' => 'CORS headers should be set']);
