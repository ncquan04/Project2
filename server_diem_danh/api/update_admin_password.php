<?php
// api/update_admin_password.php - Script đơn giản để cập nhật mật khẩu admin
require_once __DIR__ . '/../config/config.php';

// Hàm tạo log
function writeLog($message) {
    echo "$message<br>";
}

writeLog("Bắt đầu cập nhật mật khẩu admin...");

// Kiểm tra kết nối cơ sở dữ liệu
if (!$conn) {
    writeLog("Lỗi: Không thể kết nối đến cơ sở dữ liệu.");
    exit;
}
writeLog("Kết nối cơ sở dữ liệu thành công!");

// Tạo hash mật khẩu mới
$new_password = 'admin123';
$new_hash = password_hash($new_password, PASSWORD_DEFAULT);

writeLog("Hash mật khẩu mới: $new_hash");

// Cập nhật mật khẩu cho tài khoản admin
$stmt = $conn->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
$stmt->bind_param("s", $new_hash);

if ($stmt->execute()) {
    writeLog("Đã cập nhật mật khẩu admin thành công!");
    
    // Kiểm tra xác thực với mật khẩu mới
    $verify_stmt = $conn->prepare("SELECT password FROM users WHERE username = 'admin'");
    $verify_stmt->execute();
    $result = $verify_stmt->get_result();
    $user = $result->fetch_assoc();
    
    $verify_result = password_verify($new_password, $user['password']);
    writeLog("Kiểm tra xác thực với mật khẩu '$new_password': " . ($verify_result ? "THÀNH CÔNG" : "THẤT BẠI"));
} else {
    writeLog("Lỗi khi cập nhật mật khẩu: " . $conn->error);
}

writeLog("Quá trình cập nhật hoàn tất.");
echo "<p><a href='/server_diem_danh/api/auth_api.php?action=login'>Thử đăng nhập</a></p>";
?>