<?php
// api/fix_admin_account.php - Script để sửa chữa tài khoản admin
require_once __DIR__ . '/../config/config.php';

// Hàm tạo log
function writeLog($message) {
    echo "$message<br>";
    $logFile = __DIR__ . '/../logs/fix_admin_account.log';
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - $message\n", FILE_APPEND);
}

writeLog("Bắt đầu sửa chữa tài khoản admin...");

// Kiểm tra kết nối cơ sở dữ liệu
if (!$conn) {
    writeLog("Lỗi: Không thể kết nối đến cơ sở dữ liệu.");
    exit;
}
writeLog("Kết nối cơ sở dữ liệu thành công!");

// Kiểm tra xem đã có tài khoản admin chưa
$stmt = $conn->prepare("SELECT user_id, password FROM users WHERE username = 'admin'");
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $user_id = $user['user_id'];
    $current_hash = $user['password'];
    
    // Cập nhật mật khẩu mới
    $new_hash = password_hash('admin123', PASSWORD_DEFAULT);
    writeLog("Tài khoản admin đã tồn tại (ID: $user_id)");
    writeLog("Hash mật khẩu hiện tại: $current_hash");
    writeLog("Hash mật khẩu mới: $new_hash");
    
    // Thử xác thực với mật khẩu cũ
    $verify_result = password_verify('admin123', $current_hash);
    writeLog("Kiểm tra xác thực với mật khẩu 'admin123': " . ($verify_result ? "THÀNH CÔNG" : "THẤT BẠI"));
    
    if (!$verify_result) {
        // Cập nhật mật khẩu
        $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
        $update_stmt->bind_param("si", $new_hash, $user_id);
        
        if ($update_stmt->execute()) {
            writeLog("Đã cập nhật mật khẩu cho tài khoản admin thành công!");
        } else {
            writeLog("Lỗi khi cập nhật mật khẩu: " . $conn->error);
        }
    } else {
        writeLog("Mật khẩu hiện tại đã đúng, không cần cập nhật.");
    }
} else {
    // Tạo tài khoản admin mới
    $hash = password_hash('admin123', PASSWORD_DEFAULT);
    writeLog("Không tìm thấy tài khoản admin, đang tạo mới...");
    writeLog("Hash mật khẩu mới: $hash");
    
    $insert_stmt = $conn->prepare("INSERT INTO users (username, password, role, email) VALUES (?, ?, 'admin', 'admin@example.com')");
    $insert_stmt->bind_param("ss", $admin_username, $hash);
    $admin_username = 'admin';
    
    if ($insert_stmt->execute()) {
        writeLog("Đã tạo tài khoản admin mới thành công!");
    } else {
        writeLog("Lỗi khi tạo tài khoản admin: " . $conn->error);
    }
}

writeLog("Quá trình sửa chữa hoàn tất.");
echo "<p><a href='/server_diem_danh/api/auth_api.php?action=login'>Thử đăng nhập</a></p>";
?>