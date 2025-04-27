<?php
// modules/CORS.php
class CORS {
    /**
     * Thiết lập các headers cần thiết cho CORS
     */
    public static function enableCORS() {
        // Cho phép truy cập từ bất kỳ nguồn nào (trong môi trường phát triển)
        header("Access-Control-Allow-Origin: http://localhost:5173");
        
        // Cho phép sử dụng credentials (cookies, authorization headers, etc.)
        header("Access-Control-Allow-Credentials: true");
        
        // Cho phép các phương thức HTTP
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        
        // Cho phép các headers tùy chỉnh
        header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie");
        
        // Thời gian cache cho preflight request (giây)
        header("Access-Control-Max-Age: 3600");
        
        // Xử lý OPTIONS request (preflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
    }
}
?>