<?php
// api/auth_status.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../modules/Session.php';
require_once __DIR__ . '/../modules/Response.php';
require_once __DIR__ . '/../modules/CORS.php';

// Bật CORS
CORS::enableCORS();

// Khởi động session
Session::start();

// Kiểm tra xem người dùng đã đăng nhập hay chưa
if (isset($_SESSION['user_id']) && isset($_SESSION['role'])) {
    $user_data = [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? '',
        'role' => $_SESSION['role'],
    ];
    
    // Thêm thông tin bổ sung tùy theo vai trò
    if ($_SESSION['role'] === 'student' && isset($_SESSION['student_id'])) {
        $user_data['student_id'] = $_SESSION['student_id'];
    } elseif ($_SESSION['role'] === 'teacher' && isset($_SESSION['teacher_id'])) {
        $user_data['teacher_id'] = $_SESSION['teacher_id'];
    } elseif ($_SESSION['role'] === 'parent' && isset($_SESSION['student_id'])) {
        $user_data['student_id'] = $_SESSION['student_id'];
        $user_data['student_name'] = $_SESSION['student_name'] ?? '';
        $user_data['parent_cccd'] = $_SESSION['parent_cccd'] ?? '';
    }
    
    Response::json([
        'loggedIn' => true,
        'user' => $user_data,
        'sessionID' => session_id()
    ]);
} else {
    Response::json([
        'loggedIn' => false,
        'message' => 'Người dùng chưa đăng nhập hoặc phiên đã hết hạn'
    ]);
}
?>