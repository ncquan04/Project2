<?php
// api/update_all_passwords.php - Script để cập nhật mật khẩu cho tất cả các tài khoản
require_once __DIR__ . '/../config/config.php';

// Hàm tạo log
function writeLog($message) {
    echo "$message<br>";
    $logFile = __DIR__ . '/../logs/update_all_passwords.log';
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - $message\n", FILE_APPEND);
}

writeLog("Bắt đầu cập nhật mật khẩu cho tất cả tài khoản...");

// Kiểm tra kết nối cơ sở dữ liệu
if (!$conn) {
    writeLog("Lỗi: Không thể kết nối đến cơ sở dữ liệu.");
    exit;
}
writeLog("Kết nối cơ sở dữ liệu thành công!");

// Lấy tất cả tài khoản từ database
$stmt = $conn->query("SELECT user_id, username, role FROM users");
$accounts = [];
while ($row = $stmt->fetch_assoc()) {
    $accounts[] = $row;
}

if (count($accounts) == 0) {
    writeLog("Không tìm thấy tài khoản nào trong cơ sở dữ liệu!");
} else {
    writeLog("Đã tìm thấy " . count($accounts) . " tài khoản.");
    
    // Cập nhật mật khẩu cho từng tài khoản
    foreach ($accounts as $account) {
        // Mật khẩu mặc định là "admin123" cho tất cả các tài khoản
        $new_password = 'admin123';
        $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
        
        $update_stmt = $conn->prepare("UPDATE users SET password = ? WHERE user_id = ?");
        $update_stmt->bind_param("si", $new_hash, $account['user_id']);
        
        if ($update_stmt->execute()) {
            writeLog("Đã cập nhật mật khẩu thành công cho tài khoản: " . $account['username'] . " (Role: " . $account['role'] . ")");
            
            // Kiểm tra xác thực
            $verify_stmt = $conn->prepare("SELECT password FROM users WHERE user_id = ?");
            $verify_stmt->bind_param("i", $account['user_id']);
            $verify_stmt->execute();
            $result = $verify_stmt->get_result();
            $user = $result->fetch_assoc();
            
            $verify_result = password_verify($new_password, $user['password']);
            writeLog("Kiểm tra xác thực với mật khẩu '$new_password' cho " . $account['username'] . ": " . ($verify_result ? "THÀNH CÔNG" : "THẤT BẠI"));
        } else {
            writeLog("Lỗi khi cập nhật mật khẩu cho " . $account['username'] . ": " . $conn->error);
        }
    }
}

writeLog("Quá trình cập nhật hoàn tất.");
?>

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cập nhật mật khẩu</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .success {
            color: green;
        }
    </style>
</head>
<body>
    <h1>Danh sách tài khoản đã cập nhật</h1>
    
    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Mật khẩu mới</th>
        </tr>
        <?php foreach ($accounts as $account): ?>
        <tr>
            <td><?php echo $account['user_id']; ?></td>
            <td><?php echo $account['username']; ?></td>
            <td><?php echo $account['role']; ?></td>
            <td><span class="success">admin123</span></td>
        </tr>
        <?php endforeach; ?>
    </table>
    
    <p><strong>Lưu ý:</strong> Tất cả các tài khoản đã được cập nhật mật khẩu thành "admin123"</p>
    <p><a href="http://localhost:5173/login">Quay lại trang đăng nhập</a></p>
</body>
</html>