<?php
// api/admin/teachers.php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';

Session::start();
CORS::enableCORS();

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'manager'])) {
    Response::json(["error" => "Unauthorized"], 403);
    exit;
}

$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($conn->connect_error) {
    Response::json(["error" => "Database connection failed"], 500);
    exit;
}

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $stmt = $conn->query("SELECT teacher_id, full_name, department, position, employee_id FROM teachers ORDER BY full_name");
        $teachers = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "teachers" => $teachers]);
        break;

    case 'add':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['full_name'], $data['department'], $data['position'], $data['employee_id'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        
        // Check if employee_id already exists
        $stmt = $conn->prepare("SELECT teacher_id FROM teachers WHERE employee_id = ?");
        $stmt->bind_param("s", $data['employee_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            Response::json(["error" => "Mã nhân viên đã tồn tại"], 409);
            exit;
        }
        
        try {
            // Start transaction
            $conn->begin_transaction();
            
            // Insert teacher
            $stmt = $conn->prepare("INSERT INTO teachers (full_name, department, position, employee_id) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $data['full_name'], $data['department'], $data['position'], $data['employee_id']);
            $stmt->execute();
            
            $teacher_id = $conn->insert_id;
            
            // Create user account for teacher
            $password_hash = password_hash($data['employee_id'], PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT INTO users (username, password, role, teacher_id) VALUES (?, ?, 'teacher', ?)");
            $stmt->bind_param("ssi", $data['employee_id'], $password_hash, $teacher_id);
            $stmt->execute();
            
            // Commit transaction
            $conn->commit();
            Response::json(["success" => true, "message" => "Thêm giáo viên thành công"]);
        } catch (Exception $e) {
            // Rollback transaction
            $conn->rollback();
            Response::json(["error" => "Lỗi khi thêm giáo viên: " . $e->getMessage()], 500);
        }
        break;

    case 'edit':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['teacher_id'], $data['full_name'], $data['department'], $data['position'], $data['employee_id'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        
        // Check if employee_id already exists for other teacher
        $stmt = $conn->prepare("SELECT teacher_id FROM teachers WHERE employee_id = ? AND teacher_id != ?");
        $stmt->bind_param("si", $data['employee_id'], $data['teacher_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            Response::json(["error" => "Mã nhân viên đã tồn tại"], 409);
            exit;
        }
        
        $stmt = $conn->prepare("UPDATE teachers SET full_name = ?, department = ?, position = ?, employee_id = ? WHERE teacher_id = ?");
        $stmt->bind_param("ssssi", $data['full_name'], $data['department'], $data['position'], $data['employee_id'], $data['teacher_id']);
        if ($stmt->execute()) {
            Response::json(["success" => true, "message" => "Cập nhật giáo viên thành công"]);
        } else {
            Response::json(["error" => "Lỗi khi cập nhật giáo viên"], 500);
        }
        break;

    case 'delete':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['teacher_id'])) {
            Response::json(["error" => "Missing teacher_id"], 400);
            exit;
        }

        try {
            // Start transaction to ensure data integrity
            $conn->begin_transaction();

            // Delete related records in users table
            $stmt = $conn->prepare("DELETE FROM users WHERE teacher_id = ?");
            $stmt->bind_param("i", $data['teacher_id']);
            $stmt->execute();

            // Note: Add more related table deletions here if needed
            // For example, if there are teacher-class assignments, attendance records, etc.

            // Delete teacher from teachers table
            $stmt = $conn->prepare("DELETE FROM teachers WHERE teacher_id = ?");
            $stmt->bind_param("i", $data['teacher_id']);
            $stmt->execute();

            // Commit transaction
            $conn->commit();

            Response::json(["success" => true, "message" => "Xóa giáo viên thành công"]);
        } catch (mysqli_sql_exception $e) {
            // Rollback transaction if error occurs
            $conn->rollback();
            Response::json(["error" => "Không thể xóa giáo viên do lỗi cơ sở dữ liệu: " . $e->getMessage()], 500);
        } catch (Exception $e) {
            $conn->rollback();
            Response::json(["error" => "Lỗi server: " . $e->getMessage()], 500);
        } finally {
            if (isset($stmt)) {
                $stmt->close();
            }
        }
        break;

    default:
        Response::json(["error" => "Invalid action"], 400);
}

$conn->close();
?>
