<?php
// Include autoloader của Composer
require_once __DIR__ . '/../phpdotenv_lib/vendor/autoload.php';

use Dotenv\Dotenv;

// Thiết lập múi giờ Việt Nam
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Tải file .env từ thư mục
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Lấy các biến từ file .env để kết nối cơ sở dữ liệu
$dbHost = $_ENV['DB_HOST'];
$dbUsername = $_ENV['DB_USERNAME'];
$dbPassword = $_ENV['DB_PASSWORD'];
$dbName = $_ENV['DB_NAME'];

define('DB_HOST', $dbHost);
define('DB_USER', $dbUsername);
define('DB_PASS', $dbPassword);
define('DB_PASSWORD', $dbPassword); // Thêm dòng này để tránh lỗi undefined constant
define('DB_NAME', $dbName);

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

// Thiết lập charset và timezone cho MySQL
$conn->set_charset("utf8mb4");
$conn->query("SET time_zone = '+07:00'"); // Múi giờ Việt Nam (+7)