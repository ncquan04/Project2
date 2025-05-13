<?php
// api/login.php
require_once __DIR__ . '/../modules/Auth.php';
require_once __DIR__ . '/../modules/Session.php';
require_once __DIR__ . '/../modules/CSRF.php';
require_once __DIR__ . '/../modules/RateLimiter.php';
require_once __DIR__ . '/../modules/Logger.php';
require_once __DIR__ . '/../modules/Response.php';
require_once __DIR__ . '/../modules/CORS.php';
require_once __DIR__ . '/../config/config.php';

// Kích hoạt CORS
CORS::enableCORS();

// Khởi động session
Session::start();

// Log attempt
$logger = new Logger('auth_debug');
$ip = $_SERVER['REMOTE_ADDR'];

// Tiếp nhận dữ liệu từ form POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !CSRF::verify($_POST['csrf_token'])) {
        $logger->log("CSRF token invalid from IP $ip");
        Response::json(["error" => "CSRF token không hợp lệ"], 403);
        exit;
    }

    // Rate limiting - giới hạn số lần đăng nhập
    $rateLimit = new RateLimiter($ip, 'login', 10, 60 * 15); // 10 attempts per 15 minutes
    if ($rateLimit->isLimited()) {
        $logger->log("Rate limit exceeded for IP $ip");
        Response::json(["error" => "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút"], 429);
        exit;
    }
    
    // Get input data and validate
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    $loginType = $_POST['type'] ?? 'regular';  // 'regular' or 'parent'
    $studentId = $_POST['student_id'] ?? '';   // Only used for parent login
    
    // Xác thực tùy theo loại đăng nhập
    if ($loginType === 'parent') {
        // Parent login with CCCD (username) and student_id
        if (empty($username) || empty($studentId)) {
            $rateLimit->increment();
            Response::json(["error" => "Vui lòng nhập đầy đủ thông tin"], 400);
            exit;
        }

        // Kiểm tra thông tin phụ huynh trong bảng students
        $stmt = $conn->prepare("SELECT s.student_id, s.full_name, s.parent_cccd, s.parent_name 
                                FROM students s 
                                WHERE s.parent_cccd = ? AND s.student_id = ?");
        if (!$stmt) {
            $logger->log("Database error: " . $conn->error);
            Response::json(["error" => "Lỗi cơ sở dữ liệu"], 500);
            exit;
        }
        
        $stmt->bind_param("ss", $username, $studentId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $logger->log("Failed parent login attempt: CCCD $username for student $studentId");
            $rateLimit->increment();
            Response::json(["error" => "Thông tin đăng nhập không chính xác"], 401);
            exit;
        }

        $user = $result->fetch_assoc();
        $stmt->close();
        
        // Thiết lập session cho phụ huynh
        $_SESSION['user_id'] = "parent_" . $studentId;
        $_SESSION['username'] = $user['parent_name'];
        $_SESSION['role'] = 'parent';
        $_SESSION['student_id'] = $studentId;
        $_SESSION['student_name'] = $user['full_name'];
        $_SESSION['parent_cccd'] = $username;
        
        $logger->log("Successful parent login: CCCD $username for student $studentId");
        
    } else {
        // Regular login with username and password
        if (empty($username) || empty($password)) {
            $rateLimit->increment();
            Response::json(["error" => "Vui lòng nhập đầy đủ thông tin"], 400);
            exit;
        }

        // Khởi tạo đối tượng Auth và kiểm tra thông tin đăng nhập
        $auth = new Auth($conn);
        $user = $auth->login($username, $password);
        
        if (!$user) {
            $rateLimit->increment();
            $logger->log("Failed login attempt: username $username from IP $ip");
            Response::json(["error" => "Thông tin đăng nhập không chính xác"], 401);
            exit;
        }
    
        // Thiết lập session
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];
        
        if ($user['role'] === 'student') {
            $_SESSION['student_id'] = $user['student_id'];
        } elseif ($user['role'] === 'teacher') {
            $_SESSION['teacher_id'] = $user['teacher_id'];
        }
    }

    // Generate new CSRF token for the next request
    $newCsrfToken = CSRF::generate();
    
    // Return success response with role for redirection
    Response::json([
        "success" => true,
        "role" => $_SESSION['role'],
        "csrf_token" => $newCsrfToken
    ]);
    
} else {
    // Nếu không phải POST request, trả về lỗi
    Response::json(["error" => "Method not allowed"], 405);
}
?>