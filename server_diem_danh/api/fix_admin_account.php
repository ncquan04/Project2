<?php
// api/fix_admin_account.php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../modules/Logger.php';

// Tạo file log riêng cho việc sửa tài khoản admin
$logFile = __DIR__ . '/../logs/fix_admin_account.log';
function log_message($message) {
    global $logFile;
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - $message\n", FILE_APPEND);
    echo $message . "<br>";
}

log_message("Bắt đầu quá trình kiểm tra và sửa tài khoản admin");

// Kiểm tra kết nối database
if (!$conn) {
    log_message("Lỗi kết nối database: " . mysqli_connect_error());
    die("Kết nối database thất bại");
}

// Kiểm tra tài khoản admin có tồn tại không
$stmt = $conn->prepare("SELECT user_id, username, password FROM users WHERE username = 'admin'");
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    log_message("Tài khoản admin không tồn tại. Đang tạo tài khoản admin mới...");
    
    // Tạo tài khoản admin mới
    $username = 'admin';
    $password = password_hash('admin123', PASSWORD_DEFAULT);
    $role = 'admin';
    
    $stmt = $conn->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $password, $role);
    
    if ($stmt->execute()) {
        log_message("Đã tạo tài khoản admin mới thành công!");
    } else {
        log_message("Lỗi khi tạo tài khoản admin: " . $stmt->error);
    }
} else {
    $admin = $result->fetch_assoc();
    log_message("Tài khoản admin đã tồn tại với ID: " . $admin['user_id']);
    
    // Kiểm tra mật khẩu hiện tại
    $storedHash = $admin['password'];
    $plainPassword = 'admin123';
    
    log_message("Hash mật khẩu hiện tại: " . substr($storedHash, 0, 30) . "...");
    
    // Thử xác thực với mật khẩu mặc định
    $passwordVerifies = password_verify($plainPassword, $storedHash);
    log_message("Kết quả xác thực mật khẩu với password_verify: " . ($passwordVerifies ? "TRUE" : "FALSE"));
    
    if (!$passwordVerifies) {
        // Kiểm tra xem mật khẩu có phải là md5 hoặc sha1
        $md5Hash = md5($plainPassword);
        $sha1Hash = sha1($plainPassword);
        
        log_message("MD5 hash của admin123: " . $md5Hash);
        log_message("SHA1 hash của admin123: " . $sha1Hash);
        
        if ($storedHash === $md5Hash) {
            log_message("Phát hiện mật khẩu lưu dưới dạng MD5. Cần cập nhật sang password_hash.");
        } elseif ($storedHash === $sha1Hash) {
            log_message("Phát hiện mật khẩu lưu dưới dạng SHA1. Cần cập nhật sang password_hash.");
        } else {
            log_message("Mật khẩu hiện tại không phải MD5 hoặc SHA1 của admin123.");
        }
        
        // Cập nhật mật khẩu bằng password_hash
        $newPasswordHash = password_hash($plainPassword, PASSWORD_DEFAULT);
        log_message("Hash mật khẩu mới: " . substr($newPasswordHash, 0, 30) . "...");
        
        $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
        $updateStmt->bind_param("s", $newPasswordHash);
        
        if ($updateStmt->execute()) {
            log_message("Đã cập nhật mật khẩu admin thành công!");
        } else {
            log_message("Lỗi khi cập nhật mật khẩu admin: " . $updateStmt->error);
        }
    } else {
        log_message("Mật khẩu admin hiện tại đã được hash đúng cách và có thể xác thực thành công.");
    }
}

log_message("Hoàn thành quá trình kiểm tra và sửa tài khoản admin");
?>