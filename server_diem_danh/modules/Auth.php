<?php
// modules/Auth.php
require_once __DIR__ . '/../config/config.php';

class Auth {
    private $conn;

    public function __construct($dbConnection) {
        $this->conn = $dbConnection;
    }    public function login($username, $password) {
        // Debug log
        $logFile = __DIR__ . '/../logs/auth_debug.log';
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - Login attempt for: $username\n", FILE_APPEND);
        
        // Lấy thông tin cơ bản của người dùng, bao gồm cả teacher_id
        $stmt = $this->conn->prepare("SELECT user_id, username, password, role, student_id, teacher_id FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        // Ghi log kết quả truy vấn
        if (!$user) {
            file_put_contents($logFile, "User not found: $username\n", FILE_APPEND);
            Logger::log("Login failed for username: $username - User not found");
            return false;
        } else {
            file_put_contents($logFile, "User found: $username - Stored password hash: " . substr($user['password'], 0, 30) . "...\n", FILE_APPEND);
            $result = password_verify($password, $user['password']);
            file_put_contents($logFile, "password_verify result: " . ($result ? "TRUE" : "FALSE") . "\n", FILE_APPEND);
            
            if (!$result) {
                Logger::log("Login failed for username: $username - Password mismatch");
                return false;
            }
        }

        return $user;
    }
}