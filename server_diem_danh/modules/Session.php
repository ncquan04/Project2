<?php
// modules/Session.php
class Session {
    private static $timeoutDuration = 600; // 10 phút
    
    public static function start() {
        // Cấu hình session
        ini_set('session.cookie_lifetime', 0); // Session cookie hết hạn khi đóng trình duyệt
        ini_set('session.gc_maxlifetime', self::$timeoutDuration);
        ini_set('session.use_strict_mode', 1); // Chỉ chấp nhận ID phiên do máy chủ tạo        ini_set('session.cookie_httponly', 1); // Cookie không truy cập bằng JavaScript
        ini_set('session.use_only_cookies', 1); // Chỉ sử dụng cookie để lưu trữ ID phiên
        
        // Cho phép đọc cookies qua CORS nếu cần thiết
        if (isset($_SERVER['HTTP_ORIGIN'])) {
            $origin = $_SERVER['HTTP_ORIGIN'];
            if ($origin === 'http://localhost:5173') {
                ini_set('session.cookie_samesite', 'Lax'); // Use Lax for local development
            }
        }
        
        // Ghi log thông tin session
        error_log("Starting session with cookies config: SameSite=" . ini_get('session.cookie_samesite'));
        
        // Khởi tạo phiên
        session_start();
        
        // Thiết lập thời gian hoạt động cuối cùng
        if (!isset($_SESSION['last_activity'])) {
            $_SESSION['last_activity'] = time();
        }
        
        error_log('Session started: ' . session_id() . ', Role: ' . ($_SESSION['role'] ?? 'none'));
    }

    public static function check() {
        if (!isset($_SESSION['user_id'], $_SESSION['role'])) {
            return false;
        }

        if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > self::$timeoutDuration) {
            self::destroy();
            return false;
        }

        $_SESSION['last_activity'] = time();
        return true;
    }    public static function setUser($user) {
        session_regenerate_id(true);
        $_SESSION = [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'last_activity' => time(),
            'ip' => $_SERVER['REMOTE_ADDR']
        ];
        
        // Thêm dữ liệu riêng theo từng vai trò
        if ($user['role'] === 'student' && isset($user['student_id'])) {
            $_SESSION['student_id'] = $user['student_id'];
        }
        
        if ($user['role'] === 'teacher' && isset($user['teacher_id'])) {
            $_SESSION['teacher_id'] = $user['teacher_id'];
        }
        
        if ($user['role'] === 'parent' && isset($user['student_id'])) {
            $_SESSION['student_id'] = $user['student_id'];
            $_SESSION['student_name'] = $user['student_name'] ?? '';
        }
        
        // Ghi log để debug
        $logFile = __DIR__ . '/../logs/auth_debug.log';
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Session data after setUser: " . print_r($_SESSION, true) . "\n", FILE_APPEND);
    }

    public static function destroy() {
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }
        session_destroy();
    }
}