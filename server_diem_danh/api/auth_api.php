<?php
/**
 * API Authentication Module
 * Xử lý xác thực người dùng, đăng nhập, đăng xuất và quản lý phiên
 */

// Đảm bảo tất cả lỗi trả về dạng JSON
try {
    // Cấu hình CORS
    header('Access-Control-Allow-Origin: http://localhost:5173'); // Thay bằng URL của React app
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    // Xử lý OPTIONS request (preflight) từ trình duyệt
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('HTTP/1.1 200 OK');
        exit();
    }
    
    // Đảm bảo có kết nối đến config và database
    require_once __DIR__ . '/../config/config.php';

/**
 * Đăng ký tài khoản mới
 * @param string $username Tên đăng nhập
 * @param string $password Mật khẩu
 * @param string $email Email
 * @param string $fullName Họ và tên
 * @param int $roleId ID vai trò (1: admin, 2: teacher, 3: student)
 * @return array Kết quả đăng ký
 */
function registerUser($username, $password, $email, $fullName, $roleId = 3) {
    global $conn;
    
    // Kiểm tra xem username đã tồn tại chưa
    $checkStmt = $conn->prepare("SELECT user_id FROM users WHERE username = ?");
    $checkStmt->bind_param("s", $username);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        return [
            'success' => false,
            'message' => 'Tên đăng nhập đã tồn tại'
        ];
    }
    
    // Mã hóa mật khẩu với bcrypt
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Thêm người dùng mới vào database
    $stmt = $conn->prepare("INSERT INTO users (username, password, email, full_name, role_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $username, $hashedPassword, $email, $fullName, $roleId);
    
    if ($stmt->execute()) {
        $userId = $stmt->insert_id;
        return [
            'success' => true,
            'message' => 'Đăng ký thành công',
            'user_id' => $userId
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Đăng ký thất bại: ' . $stmt->error
        ];
    }
}

/**
 * Đăng nhập người dùng
 * @param string $username Tên đăng nhập
 * @param string $password Mật khẩu
 * @return array Thông tin người dùng và token nếu đăng nhập thành công
 */
function loginUser($username, $password) {
    global $conn;
    
    // Lấy thông tin người dùng từ database
    $stmt = $conn->prepare("
        SELECT u.user_id, u.username, u.password, u.email, u.full_name, u.role_id, r.role_name 
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.username = ? AND u.active = TRUE
    ");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return [
            'success' => false,
            'message' => 'Tên đăng nhập không tồn tại hoặc tài khoản đã bị khóa'
        ];
    }
    
    $user = $result->fetch_assoc();
    
    // Xác thực mật khẩu với bcrypt
    if (password_verify($password, $user['password'])) {
        // Tạo session token - không cần gọi session_start() vì đã được gọi trong config.php
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['role_name'] = $user['role_name'];
        
        // Lấy thêm thông tin liên quan (nếu là giáo viên hoặc sinh viên)
        $additionalInfo = [];
        
        if ($user['role_name'] === 'teacher') {
            $teacherStmt = $conn->prepare("SELECT teacher_id, department FROM teachers WHERE user_id = ?");
            $teacherStmt->bind_param("i", $user['user_id']);
            $teacherStmt->execute();
            $teacherResult = $teacherStmt->get_result();
            if ($teacherResult->num_rows > 0) {
                $additionalInfo = $teacherResult->fetch_assoc();
            }
        } elseif ($user['role_name'] === 'student') {
            $studentStmt = $conn->prepare("SELECT student_id, rfid_uid, class FROM students WHERE user_id = ?");
            $studentStmt->bind_param("i", $user['user_id']);
            $studentStmt->execute();
            $studentResult = $studentStmt->get_result();
            if ($studentResult->num_rows > 0) {
                $additionalInfo = $studentResult->fetch_assoc();
            }
        }
        
        // Log đăng nhập thành công
        logAction($user['user_id'], 'login', 'users', $user['user_id'], $_SERVER['REMOTE_ADDR']);
        
        return [
            'success' => true,
            'message' => 'Đăng nhập thành công',
            'user' => [
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'role_id' => $user['role_id'],
                'role_name' => $user['role_name'],
                ...$additionalInfo
            ]
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Mật khẩu không chính xác'
        ];
    }
}

/**
 * Đăng xuất người dùng
 * @return array Kết quả đăng xuất
 */
function logoutUser() {
    // Không cần gọi session_start() vì đã được gọi trong config.php
    
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        
        // Hủy session
        session_unset();
        session_destroy();
        
        // Log đăng xuất
        logAction($userId, 'logout', 'users', $userId, $_SERVER['REMOTE_ADDR']);
        
        return [
            'success' => true,
            'message' => 'Đăng xuất thành công'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Không có phiên đăng nhập'
        ];
    }
}

/**
 * Kiểm tra xem người dùng đã đăng nhập chưa
 * @return bool True nếu đã đăng nhập, False nếu chưa
 */
function isLoggedIn() {
    // Không cần gọi session_start() vì đã được gọi trong config.php
    return isset($_SESSION['user_id']);
}

/**
 * Kiểm tra quyền truy cập của người dùng
 * @param array $allowedRoles Mảng các role được phép truy cập
 * @return bool True nếu có quyền, False nếu không
 */
function checkPermission($allowedRoles = []) {
    // Không cần gọi session_start() vì đã được gọi trong config.php
    
    if (!isset($_SESSION['role_name'])) {
        return false;
    }
    
    if (empty($allowedRoles)) {
        return true; // Không yêu cầu role cụ thể, cho phép tất cả người dùng đã đăng nhập
    }
    
    return in_array($_SESSION['role_name'], $allowedRoles);
}

/**
 * Thay đổi mật khẩu người dùng
 * @param int $userId ID người dùng
 * @param string $currentPassword Mật khẩu hiện tại
 * @param string $newPassword Mật khẩu mới
 * @return array Kết quả thay đổi mật khẩu
 */
function changePassword($userId, $currentPassword, $newPassword) {
    global $conn;
    
    // Lấy mật khẩu hiện tại từ database
    $stmt = $conn->prepare("SELECT password FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return [
            'success' => false,
            'message' => 'Người dùng không tồn tại'
        ];
    }
    
    $user = $result->fetch_assoc();
    
    // Xác thực mật khẩu hiện tại
    if (!password_verify($currentPassword, $user['password'])) {
        return [
            'success' => false,
            'message' => 'Mật khẩu hiện tại không chính xác'
        ];
    }
    
    // Mã hóa mật khẩu mới với bcrypt
    $hashedNewPassword = password_hash($newPassword, PASSWORD_BCRYPT);
    
    // Cập nhật mật khẩu mới vào database
    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
    $updateStmt->bind_param("si", $hashedNewPassword, $userId);
    
    if ($updateStmt->execute()) {
        // Log thay đổi mật khẩu
        logAction($userId, 'change_password', 'users', $userId, $_SERVER['REMOTE_ADDR']);
        
        return [
            'success' => true,
            'message' => 'Thay đổi mật khẩu thành công'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Thay đổi mật khẩu thất bại: ' . $updateStmt->error
        ];
    }
}

/**
 * Ghi log hành động vào bảng system_logs
 * @param int $userId ID người dùng thực hiện hành động
 * @param string $action Hành động
 * @param string $entityType Loại đối tượng tác động
 * @param string $entityId ID đối tượng tác động
 * @param string $ipAddress Địa chỉ IP
 */
function logAction($userId, $action, $entityType, $entityId, $ipAddress) {
    global $conn;
    
    $stmt = $conn->prepare("
        INSERT INTO system_logs (user_id, action, entity_type, entity_id, ip_address) 
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("issss", $userId, $action, $entityType, $entityId, $ipAddress);
    $stmt->execute();
}

/**
 * Xử lý API request
 * Hàm này xử lý tất cả các request đến auth_api.php
 */
function handleAuthRequest() {
    // Đảm bảo response là JSON
    header('Content-Type: application/json');
    
    // Lấy HTTP method và action từ request
    $method = $_SERVER['REQUEST_METHOD'];
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    // Xử lý request theo method và action
    switch ($method) {
        case 'POST':
            switch ($action) {
                case 'register':
                    $data = json_decode(file_get_contents('php://input'), true);
                    if (isset($data['username'], $data['password'], $data['email'], $data['full_name'])) {
                        $roleId = isset($data['role_id']) ? $data['role_id'] : 3; // Default: student
                        $result = registerUser($data['username'], $data['password'], $data['email'], $data['full_name'], $roleId);
                        echo json_encode($result);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Thiếu thông tin đăng ký'
                        ]);
                    }
                    break;
                    
                case 'login':
                    $data = json_decode(file_get_contents('php://input'), true);
                    if (isset($data['username'], $data['password'])) {
                        $result = loginUser($data['username'], $data['password']);
                        echo json_encode($result);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Thiếu thông tin đăng nhập'
                        ]);
                    }
                    break;
                    
                case 'logout':
                    $result = logoutUser();
                    echo json_encode($result);
                    break;
                    
                case 'change_password':
                    $data = json_decode(file_get_contents('php://input'), true);
                    if (isset($data['user_id'], $data['current_password'], $data['new_password'])) {
                        $result = changePassword($data['user_id'], $data['current_password'], $data['new_password']);
                        echo json_encode($result);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Thiếu thông tin thay đổi mật khẩu'
                        ]);
                    }
                    break;
                    
                default:
                    echo json_encode([
                        'success' => false,
                        'message' => 'Hành động không hợp lệ'
                    ]);
                    break;
            }
            break;
            
        case 'GET':
            switch ($action) {
                case 'check_auth':
                    $isLoggedIn = isLoggedIn();
                    if ($isLoggedIn) {
                        echo json_encode([
                            'success' => true,
                            'message' => 'Đã đăng nhập',
                            'user' => [
                                'user_id' => $_SESSION['user_id'],
                                'username' => $_SESSION['username'],
                                'role_id' => $_SESSION['role_id'],
                                'role_name' => $_SESSION['role_name']
                            ]
                        ]);
                    } else {
                        echo json_encode([
                            'success' => false,
                            'message' => 'Chưa đăng nhập'
                        ]);
                    }
                    break;
                    
                default:
                    echo json_encode([
                        'success' => false,
                        'message' => 'Hành động không hợp lệ'
                    ]);
                    break;
            }
            break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Phương thức không được hỗ trợ'
            ]);
            break;
    }
}

// Xử lý request nếu file được gọi trực tiếp
if (basename($_SERVER['PHP_SELF']) === basename(__FILE__)) {
    handleAuthRequest();
}
} catch (Exception $e) {
    // Trả về lỗi dưới dạng JSON
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Đã xảy ra lỗi: ' . $e->getMessage()
    ]);
    exit();
}