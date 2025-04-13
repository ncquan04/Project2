<?php
// Tắt hiển thị lỗi PHP trực tiếp để tránh trả về HTML thay vì JSON
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Bắt các lỗi và chuyển về định dạng JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $error = [
        'success' => false,
        'message' => 'PHP Error: ' . $errstr,
        'error_details' => [
            'file' => $errfile,
            'line' => $errline,
            'type' => $errno
        ]
    ];
    
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($error);
    exit;
});

header('Content-Type: application/json; charset=UTF-8');

// Cấu hình session TRƯỚC KHI session_start()
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
session_name('DIEMDANHID');
session_set_cookie_params([
    'lifetime' => 86400, // 1 day
    'path' => '/',
    'domain' => '',
    'secure' => false, // Set to true if using HTTPS
    'httponly' => true,
    'samesite' => 'Lax'
]);

// Bây giờ khởi động session
session_start();

// Include autoloader của Composer
require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;

// Tải file .env từ thư mục gốc
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Lấy các biến từ file .env để kết nối cơ sở dữ liệu
$dbHost = $_ENV['DB_HOST'];
$dbUsername = $_ENV['DB_USERNAME'];
$dbPassword = $_ENV['DB_PASSWORD'];
$dbName = $_ENV['DB_NAME'];

// Kiểm tra nếu thiếu biến môi trường
if (!$dbHost || !$dbUsername || !$dbName) {
    http_response_code(500);
    echo json_encode(["error" => "Thiếu thông tin cấu hình cơ sở dữ liệu"]);
    exit;
}

// Kết nối cơ sở dữ liệu
$conn = new mysqli($dbHost, $dbUsername, $dbPassword, $dbName);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Kết nối cơ sở dữ liệu thất bại"]);
    exit;
}
?>