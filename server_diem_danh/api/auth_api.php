<?php
// api/auth_api.php - API xác thực tập trung không sử dụng session
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/../modules/Response.php';
require_once __DIR__ . '/../modules/RateLimiter.php';
require_once __DIR__ . '/../modules/Logger.php';
require_once __DIR__ . '/../modules/Auth.php';
require_once __DIR__ . '/../modules/Session.php';
require_once __DIR__ . '/../modules/CORS.php';

// Ghi log cho debug
$logFile = __DIR__ . '/../logs/auth_api_debug.log';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request received\n", FILE_APPEND);

// Thiết lập error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Kích hoạt CORS
CORS::enableCORS();

// Nếu là preflight request (OPTIONS), trả về 200 OK và dừng script
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Ghi log header trả về cho preflight request
    $headers = headers_list();
    file_put_contents($logFile, "[OPTIONS] Response headers: " . print_r($headers, true) . "\n", FILE_APPEND);
    http_response_code(200);
    exit();
}

// Log request details
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
$requestMethod = $_SERVER['REQUEST_METHOD'];
$contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
$cookies = isset($_SERVER['HTTP_COOKIE']) ? $_SERVER['HTTP_COOKIE'] : '';

file_put_contents($logFile, "Request details:\n", FILE_APPEND);
file_put_contents($logFile, "Origin: $origin\n", FILE_APPEND);
file_put_contents($logFile, "Method: $requestMethod\n", FILE_APPEND);
file_put_contents($logFile, "Content-Type: $contentType\n", FILE_APPEND);
file_put_contents($logFile, "Cookies: $cookies\n", FILE_APPEND);

// Thiết lập security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// Ghi log toàn bộ header trả về (debug CORS)
ob_start();
register_shutdown_function(function() use ($logFile) {
    $headers = headers_list();
    file_put_contents($logFile, "Response headers: " . print_r($headers, true) . "\n", FILE_APPEND);
});

// Lấy hành động từ tham số
$action = $_GET['action'] ?? '';
file_put_contents($logFile, "Action: $action\n", FILE_APPEND);

// Xử lý các hành động khác nhau
switch ($action) {
    case 'login':
        // Chỉ chấp nhận POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            file_put_contents($logFile, "Method not allowed: " . $_SERVER['REQUEST_METHOD'] . "\n", FILE_APPEND);
            Response::json(["success" => false, "message" => "Chỉ chấp nhận phương thức POST"], 405);
            exit;
        }
        
        // Đọc dữ liệu đầu vào
        $rawInput = file_get_contents('php://input');
        file_put_contents($logFile, "Raw input: $rawInput\n", FILE_APPEND);
        $input = json_decode($rawInput, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            file_put_contents($logFile, "JSON error: " . json_last_error_msg() . "\n", FILE_APPEND);
            Response::json(["success" => false, "message" => "Dữ liệu JSON không hợp lệ: " . json_last_error_msg()], 400);
            exit;
        }
        
        // Validate và sanitize input
        $username = isset($input['username']) ? trim(strip_tags($input['username'])) : null;
        $password = $input['password'] ?? null;
        file_put_contents($logFile, "Username: $username\n", FILE_APPEND);
        
        if (empty($username) || empty($password)) {
            file_put_contents($logFile, "Missing username or password\n", FILE_APPEND);
            Response::json(["success" => false, "message" => "Tên đăng nhập và mật khẩu là bắt buộc"], 400);
            exit;
        }
        
        // Rate limiting
        $ip = $_SERVER['REMOTE_ADDR'];
        if (!RateLimiter::check($ip)) {
            file_put_contents($logFile, "Rate limit exceeded for IP: $ip\n", FILE_APPEND);
            Response::json([
                "success" => false,
                "message" => "Tài khoản tạm thời bị khóa. Vui lòng thử lại sau 5 phút."
            ], 429);
            exit;
        }
        
        // Xử lý đăng nhập
        require_once __DIR__ . '/../config/config.php';
        $auth = new Auth($conn);
        $user = $auth->login($username, $password);
        
        if (!$user) {
            file_put_contents($logFile, "Login failed for username: $username\n", FILE_APPEND);
            $attemptsRemaining = RateLimiter::increment($ip);
            Response::json([
                "success" => false,
                "message" => "Tên đăng nhập hoặc mật khẩu không đúng",
                "attempts_remaining" => $attemptsRemaining
            ], 401);
            exit;
        }
          // Đăng nhập thành công - Khởi tạo phiên (session)
        file_put_contents($logFile, "Login successful for username: $username\n", FILE_APPEND);
        RateLimiter::reset($ip);
        Logger::log("Người dùng {$user['username']} đăng nhập thành công");
        
        // Khởi tạo session cho phiên làm việc
        Session::start();
        Session::setUser($user);
        
        file_put_contents($logFile, "Session started, ID: " . session_id() . "\n", FILE_APPEND);
        file_put_contents($logFile, "Session data: " . print_r($_SESSION, true) . "\n", FILE_APPEND);
        
        // Trả về thông tin người dùng
        $userData = [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'student_id' => $user['student_id'] ?? null,
            'teacher_id' => $user['teacher_id'] ?? null
        ];
        
        Response::json([
            "success" => true,
            "message" => "Đăng nhập thành công",
            "redirect" => getDashboardUrl($user['role']),
            "role" => $user['role'],
            "user" => $userData
        ]);
        break;
          case 'logout':
        // Xử lý đăng xuất
        Session::start();
        
        // Ghi log trước khi hủy session
        file_put_contents($logFile, "Logout request - Session before destroy: " . print_r($_SESSION, true) . "\n", FILE_APPEND);
        
        // Hủy session
        Session::destroy();
        
        // Trả về kết quả
        Response::json(["success" => true, "message" => "Đăng xuất thành công"]);
        break;
    
    case 'check_auth':
        // API chỉ để kiểm tra xem frontend có thể gọi được hay không
        Response::json([
            "success" => true,
            "logged_in" => false,
            "message" => "API hoạt động bình thường"
        ]);
        break;
    
    default:
        Response::json(["success" => false, "message" => "Hành động không hợp lệ"], 400);
        break;
}