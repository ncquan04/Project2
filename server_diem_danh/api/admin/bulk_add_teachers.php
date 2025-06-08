<?php
// api/admin/bulk_add_teachers.php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';

Session::start();
CORS::enableCORS();

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    Response::json(["error" => "Unauthorized"], 403);
    exit;
}

$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($conn->connect_error) {
    Response::json(["error" => "Database connection failed"], 500);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['teachers']) || !is_array($data['teachers'])) {
    Response::json(["error" => "Invalid data format"], 400);
    exit;
}

$teachers = $data['teachers'];
$added_count = 0;
$errors = [];

try {
    $conn->begin_transaction();
    
    foreach ($teachers as $index => $teacher) {
        $row = $index + 1;
        
        // Validate required fields
        if (empty($teacher['full_name']) || empty($teacher['department']) || 
            empty($teacher['position']) || empty($teacher['employee_id'])) {
            $errors[] = "Dòng {$row}: Thiếu thông tin bắt buộc";
            continue;
        }
        
        // Check if employee_id already exists
        $stmt = $conn->prepare("SELECT teacher_id FROM teachers WHERE employee_id = ?");
        $stmt->bind_param("s", $teacher['employee_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $errors[] = "Dòng {$row}: Mã nhân viên '{$teacher['employee_id']}' đã tồn tại";
            continue;
        }
        
        try {
            // Insert teacher
            $stmt = $conn->prepare("INSERT INTO teachers (full_name, department, position, employee_id) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $teacher['full_name'], $teacher['department'], $teacher['position'], $teacher['employee_id']);
            $stmt->execute();
            
            $teacher_id = $conn->insert_id;
            
            // Create user account for teacher
            $password_hash = password_hash($teacher['employee_id'], PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT INTO users (username, password, role, teacher_id) VALUES (?, ?, 'teacher', ?)");
            $stmt->bind_param("ssi", $teacher['employee_id'], $password_hash, $teacher_id);
            $stmt->execute();
            
            $added_count++;
            
        } catch (Exception $e) {
            $errors[] = "Dòng {$row}: Lỗi khi thêm giáo viên - " . $e->getMessage();
        }
    }
    
    if ($added_count > 0) {
        $conn->commit();
        
        $message = "Thêm thành công {$added_count} giáo viên";
        if (!empty($errors)) {
            $message .= ". Có " . count($errors) . " lỗi:";
        }
        
        Response::json([
            "success" => true, 
            "message" => $message,
            "added_count" => $added_count,
            "errors" => $errors
        ]);
    } else {
        $conn->rollback();
        Response::json([
            "success" => false, 
            "message" => "Không thể thêm giáo viên nào",
            "errors" => $errors
        ], 400);
    }
    
} catch (Exception $e) {
    $conn->rollback();
    Response::json(["error" => "Lỗi server: " . $e->getMessage()], 500);
}

$conn->close();
?>
