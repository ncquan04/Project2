<?php
// Reset mật khẩu cho tài khoản admin
require_once __DIR__ . '/config/config.php';

// Mật khẩu mới: admin123
$password = 'admin123';
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

echo "Password hash mới: " . $hashedPassword . "\n";

// Cập nhật mật khẩu cho admin trong database
$sql = "UPDATE users SET password = ? WHERE username = 'admin'";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $hashedPassword);

if ($stmt->execute()) {
    echo "Đã cập nhật mật khẩu cho tài khoản admin thành công!\n";
    echo "Bạn có thể đăng nhập với admin/admin123\n";
} else {
    echo "Lỗi khi cập nhật mật khẩu: " . $stmt->error . "\n";
}