<?php
// Hàm lấy URL Ngrok từ API
function getNgrokUrl() {
    $url = "http://localhost:4040/api/tunnels";
    $response = @file_get_contents($url);
    if ($response === false) {
        echo "Không thể lấy URL Ngrok. Đảm bảo Ngrok đang chạy.\n";
        return null;
    }

    $data = json_decode($response, true);
    if (isset($data['tunnels'][0]['public_url'])) {
        return $data['tunnels'][0]['public_url'];
    } else {
        echo "Không tìm thấy URL Ngrok trong phản hồi.\n";
        return null;
    }
}

// Hàm cập nhật URL vào file .env
function updateEnvFile($ngrokUrl) {
    // Kiểm tra xem biến môi trường hoặc tham số đã được cung cấp chưa
    if (isset($_SERVER['SERVER_DIEM_DANH_PATH'])) {
        $serverDir = $_SERVER['SERVER_DIEM_DANH_PATH'];
    } else {
        // Yêu cầu người dùng nhập đường dẫn khi chạy script qua CLI
        echo "Nhập đường dẫn tới thư mục server_diem_danh (ví dụ: C:/xampp/htdocs/server_diem_danh): ";
        $serverDir = trim(fgets(STDIN));
    }

    $envPath = realpath("$serverDir/.env");
    if ($envPath === false || !file_exists($envPath)) {
        echo "Không tìm thấy file .env tại: $envPath\n";
        return false;
    }

    $newUrl = "URL_SERVER=$ngrokUrl/server_diem_danh/api.php\n";

    // Tiếp tục xử lý như cũ...
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        echo "Không thể đọc file .env tại: $envPath\n";
        return false;
    }

    $updated = false;
    foreach ($lines as &$line) {
        if (strpos($line, 'URL_SERVER=') === 0) {
            $line = $newUrl;
            $updated = true;
            break;
        }
    }

    if (!$updated) {
        $lines[] = $newUrl;
    }

    $result = file_put_contents($envPath, implode("\n", $lines) . "\n");
    if ($result === false) {
        echo "Không thể ghi file .env tại: $envPath\n";
        return false;
    }
    return true;
}

// Hàm cập nhật URL vào file main.cpp
function updateMainCpp($ngrokUrl) {
    // Đường dẫn tương đối từ update_ngrok_url.php tới main.cpp
    $mainCppPath = realpath(__DIR__ . '/../esp32/src/main.cpp');
    
    // Kiểm tra xem file main.cpp có tồn tại không
    if ($mainCppPath === false || !file_exists($mainCppPath)) {
        echo "Không tìm thấy file main.cpp tại: $mainCppPath\n";
        return false;
    }

    $newUrlLine = "const char* serverUrl = \"$ngrokUrl/server_diem_danh/api.php\";\n";

    // Đọc nội dung file main.cpp
    $lines = file($mainCppPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        echo "Không thể đọc file main.cpp tại: $mainCppPath\n";
        return false;
    }

    // Cập nhật dòng serverUrl
    $updated = false;
    foreach ($lines as &$line) {
        if (trim($line) === "const char* serverUrl = \"YOUR_SERVER_URL_HERE\";") {
            $line = $newUrlLine;
            $updated = true;
            break;
        }
    }

    // Nếu không tìm thấy dòng serverUrl, báo lỗi
    if (!$updated) {
        echo "Không tìm thấy dòng 'const char* serverUrl = \"YOUR_SERVER_URL_HERE\";' trong main.cpp\n";
        return false;
    }

    // Ghi lại file main.cpp
    $result = file_put_contents($mainCppPath, implode("\n", $lines) . "\n");
    if ($result === false) {
        echo "Không thể ghi file main.cpp tại: $mainCppPath\n";
        return false;
    }
    return true;
}

// Thực thi
$ngrokUrl = getNgrokUrl();
if ($ngrokUrl) {
    echo "Ngrok URL: $ngrokUrl\n";

    // Cập nhật file .env
    if (updateEnvFile($ngrokUrl)) {
        echo "Đã cập nhật URL vào file .env thành công!\n";
    } else {
        echo "Cập nhật file .env thất bại.\n";
    }

    // Cập nhật file main.cpp
    if (updateMainCpp($ngrokUrl)) {
        echo "Đã cập nhật URL vào file main.cpp thành công!\n";
    } else {
        echo "Cập nhật file main.cpp thất bại.\n";
    }
} else {
    echo "Không thể lấy URL Ngrok.\n";
}
?>