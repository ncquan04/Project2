<?php
// tools/add_cors_to_api_files.php
// Script để thêm CORS vào tất cả các tệp API

function addCORSToFile($filePath) {
    if (!file_exists($filePath) || filesize($filePath) <= 10) {
        echo "Skipping empty or non-existent file: $filePath\n";
        return;
    }

    $content = file_get_contents($filePath);
    
    // Kiểm tra xem tệp đã có module CORS chưa
    if (strpos($content, "require_once __DIR__ . '/../../modules/CORS.php'") !== false ||
        strpos($content, "require_once __DIR__ . '/../modules/CORS.php'") !== false) {
        echo "CORS module already included in: $filePath\n";
        
        // Kiểm tra xem có lời gọi CORS::enableCORS() chưa
        if (strpos($content, "CORS::enableCORS()") === false) {
            echo "Adding CORS::enableCORS() call to: $filePath\n";
            
            // Tìm và thêm lời gọi enableCORS sau Session::start() hoặc trước đó
            if (strpos($content, "Session::start();") !== false) {
                $content = str_replace(
                    "Session::start();",
                    "// Kích hoạt CORS\nCORS::enableCORS();\n\n// Khởi động session\nSession::start();",
                    $content
                );
            } else {
                // Thêm sau các khai báo require
                $pattern = '/(require_once.*?;\s*)\n/m';
                $lastRequire = preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE);
                if ($lastRequire) {
                    $lastPos = end($matches[0])[1] + strlen(end($matches[0])[0]);
                    $content = substr($content, 0, $lastPos) . 
                              "\n// Kích hoạt CORS\nCORS::enableCORS();\n" . 
                              substr($content, $lastPos);
                }
            }
            
            file_put_contents($filePath, $content);
        }
        return;
    }

    echo "Adding CORS module to: $filePath\n";
    
    // Thêm khai báo require_once cho module CORS
    $pattern = '/(require_once.*?Response\.php\';\s*)\n/m';
    if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
        $pos = $matches[0][1] + strlen($matches[0][0]);
        $relativePath = (strpos($filePath, '/api/teacher/') !== false) ? 
                        "require_once __DIR__ . '/../../modules/CORS.php';" : 
                        "require_once __DIR__ . '/../modules/CORS.php';";
        
        $content = substr($content, 0, $pos) . 
                  $relativePath . "\n" . 
                  substr($content, $pos);
    } else {
        echo "Could not locate proper position to add CORS module in: $filePath\n";
        return;
    }
    
    // Thêm lời gọi CORS::enableCORS()
    if (strpos($content, "Session::start();") !== false) {
        $content = str_replace(
            "Session::start();",
            "// Kích hoạt CORS\nCORS::enableCORS();\n\n// Khởi động session\nSession::start();",
            $content
        );
    } else {
        // Thêm sau các khai báo require
        $pattern = '/(require_once.*?;\s*)\n/m';
        $lastRequire = preg_match_all($pattern, $content, $matches, PREG_OFFSET_CAPTURE);
        if ($lastRequire) {
            $lastPos = end($matches[0])[1] + strlen(end($matches[0])[0]);
            $content = substr($content, 0, $lastPos) . 
                      "\n// Kích hoạt CORS\nCORS::enableCORS();\n" . 
                      substr($content, $lastPos);
        }
    }
    
    file_put_contents($filePath, $content);
    echo "Successfully updated: $filePath\n";
}

// API directories to process
$apiDirs = [
    __DIR__ . '/../api/',
    __DIR__ . '/../api/teacher/',
    __DIR__ . '/../api/student/',
    __DIR__ . '/../api/admin/',
    __DIR__ . '/../api/esp32/'
];

foreach ($apiDirs as $dir) {
    if (!is_dir($dir)) {
        echo "Directory doesn't exist: $dir\n";
        continue;
    }
    
    $files = glob($dir . '*.php');
    foreach ($files as $file) {
        addCORSToFile($file);
    }
}

echo "\nCORS update complete!\n";
?>
