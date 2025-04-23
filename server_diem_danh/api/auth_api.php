<?php
// api/auth_api.php - API xác thực tập trung không sử dụng session
require_once __DIR__ . '/utils.php';
require_once __DIR__ . '/../modules/Response.php';
require_once __DIR__ . '/../modules/RateLimiter.php';
require_once __DIR__ . '/../modules/Logger.php';
require_once __DIR__ . '/../modules/Auth.php';
require_once __DIR__ . '/../modules/Session.php';

// Ghi log cho debug
$logFile = __DIR__ . '/../logs/auth_api_debug.log';
file_put_contents($logFile, date('Y-m-d H:i:s') . " - Request received\n", FILE_APPEND);

// Thiết lập error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../logs/error.log');

// Lấy Origin từ request headers
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
file_put_contents($logFile, "Origin: $origin\n", FILE_APPEND);

// Danh sách các domain được phép truy cập
$allowed_origins = [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server
    'http://localhost', // Production build
    'null', // Fallback cho file:// URLs
    '', // Empty origin
];

// Kiểm tra nếu origin nằm trong danh sách được phép
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Mặc định cho phép localhost:5173
    header("Access-Control-Allow-Origin: http://localhost:5173");
}

// Cấu hình CORS đầy đủ
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 3600"); // Cache preflight request trong 1 giờ

// Thiết lập security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// Xử lý preflight request OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
        
        // Đăng nhập thành công - KHÔNG dùng session
        file_put_contents($logFile, "Login successful for username: $username\n", FILE_APPEND);
        RateLimiter::reset($ip);
        Logger::log("Người dùng {$user['username']} đăng nhập thành công");
        
        // Trả về thông tin người dùng
        $userData = [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'student_id' => $user['student_id'] ?? null
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
        // Xử lý đăng xuất - không cần session
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