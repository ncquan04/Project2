<?php
// api/admin/students.php

// Tắt hiển thị lỗi trực tiếp
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

require_once __DIR__ . '/../../config/config.php'; // Kết nối database
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';

// Khởi động session
Session::start();
CORS::enableCORS();

// Kiểm tra quyền admin hoặc manager
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'manager'])) {
    Response::json(["error" => "Unauthorized"], 403);
    exit;
}

// Xử lý các action
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }        $stmt = $conn->query("SELECT student_id, full_name, class, email, phone, rfid_uid FROM students");
        $students = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "students" => $students]);
        break;

    case 'add':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);        if (!isset($data['student_id'], $data['full_name'], $data['class'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        
        // RFID UID is optional - set to NULL if empty to avoid unique constraint issues
        $rfid_uid = isset($data['rfid_uid']) && !empty(trim($data['rfid_uid'])) ? trim($data['rfid_uid']) : null;
        
        $stmt = $conn->prepare("SELECT student_id FROM students WHERE student_id = ?");
        $stmt->bind_param("s", $data['student_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            Response::json(["error" => "Mã sinh viên đã tồn tại"], 409);
            exit;
        }
        
        try {
            // Start transaction
            $conn->begin_transaction();
            
            // Insert student
            $stmt = $conn->prepare("INSERT INTO students (student_id, full_name, class, rfid_uid) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $data['student_id'], $data['full_name'], $data['class'], $rfid_uid);
            $stmt->execute();
            
            // Create user account for student
            $password_hash = password_hash($data['student_id'], PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, 'student', ?)");
            $stmt->bind_param("sss", $data['student_id'], $password_hash, $data['student_id']);
            $stmt->execute();
            
            // Commit transaction
            $conn->commit();
            Response::json(["success" => true, "message" => "Thêm sinh viên thành công"]);
        } catch (Exception $e) {
            // Rollback transaction
            $conn->rollback();
            Response::json(["error" => "Lỗi khi thêm sinh viên: " . $e->getMessage()], 500);
        }
        break;

    case 'edit':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['student_id'], $data['full_name'], $data['class'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;        }
        
        // RFID UID is optional - set to NULL if empty to avoid unique constraint issues
        $rfid_uid = isset($data['rfid_uid']) && !empty(trim($data['rfid_uid'])) ? trim($data['rfid_uid']) : null;
        
        $stmt = $conn->prepare("UPDATE students SET full_name = ?, class = ?, rfid_uid = ? WHERE student_id = ?");
        $stmt->bind_param("ssss", $data['full_name'], $data['class'], $rfid_uid, $data['student_id']);
        if ($stmt->execute()) {
            Response::json(["success" => true, "message" => "Cập nhật sinh viên thành công"]);
        } else {
            Response::json(["error" => "Lỗi khi cập nhật sinh viên"], 500);
        }
        break;

    case 'delete':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['student_id'])) {
            Response::json(["error" => "Missing student_id"], 400);
            exit;
        }

        try {
            // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
            $conn->begin_transaction();

            // Xóa các bản ghi liên quan trong bảng attendance
            $stmt = $conn->prepare("DELETE FROM attendance WHERE student_id = ?");
            $stmt->bind_param("s", $data['student_id']);
            $stmt->execute();

            // Xóa các bản ghi liên quan trong bảng users
            $stmt = $conn->prepare("DELETE FROM users WHERE student_id = ?");
            $stmt->bind_param("s", $data['student_id']);
            $stmt->execute();

            // Xóa sinh viên từ bảng students
            $stmt = $conn->prepare("DELETE FROM students WHERE student_id = ?");
            $stmt->bind_param("s", $data['student_id']);
            $stmt->execute();

            // Commit transaction
            $conn->commit();

            Response::json(["success" => true]);
        } catch (mysqli_sql_exception $e) {
            // Rollback transaction nếu có lỗi
            $conn->rollback();
            Response::json(["error" => "Không thể xóa sinh viên do lỗi cơ sở dữ liệu: " . $e->getMessage()], 500);
        } catch (Exception $e) {
            $conn->rollback();
            Response::json(["error" => "Lỗi server: " . $e->getMessage()], 500);
        } finally {
            if (isset($stmt)) {
                $stmt->close();
            }
        }
        break;

    case 'attendance':
        $filters = json_decode(file_get_contents('php://input'), true);
        $query = "SELECT attendance_id, student_id, checkin_time, room FROM attendance WHERE 1=1";
        $params = [];
        $types = "";
        if (!empty($filters['date'])) {
            $query .= " AND DATE(checkin_time) = ?";
            $params[] = $filters['date'];
            $types .= "s";
        }
        if (!empty($filters['startTime']) && !empty($filters['endTime'])) {
            $startTime = strtotime($filters['startTime']);
            $endTime = strtotime($filters['endTime']);
            if ($startTime === false || $endTime === false || $startTime >= $endTime) {
                Response::json(["error" => "Khoảng thời gian không hợp lệ"], 400);
                exit;
            }
            $query .= " AND TIME(checkin_time) BETWEEN ? AND ?";
            $params[] = $filters['startTime'];
            $params[] = $filters['endTime'];
            $types .= "ss";
        }
        if (!empty($filters['room'])) {
            $query .= " AND room = ?";
            $params[] = $filters['room'];
            $types .= "s";
        }
        $stmt = $conn->prepare($query);
        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }
        $stmt->execute();
        $result = $stmt->get_result();
        $attendance = $result->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "attendance" => $attendance]);
        break;

    case 'rooms':
        $stmt = $conn->query("SELECT DISTINCT room FROM attendance");
        $rooms = $stmt->fetch_all(MYSQLI_ASSOC);
        $rooms = array_column($rooms, 'room');
        Response::json(["success" => true, "rooms" => $rooms]);
        break;

    case 'manual_attendance':
        if ($_SESSION['role'] !== 'manager') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['entries']) || !is_array($data['entries'])) {
            Response::json(["error" => "Dữ liệu không hợp lệ"], 400);
            exit;
        }

        try {
            $conn->begin_transaction();
            $stmt = $conn->prepare("INSERT INTO attendance (student_id, room) VALUES (?, ?)");

            foreach ($data['entries'] as $entry) {
                $student_id = $entry['student_id'];
                $room = $entry['room'];

                // Kiểm tra student_id tồn tại
                $checkStmt = $conn->prepare("SELECT student_id FROM students WHERE student_id = ?");
                $checkStmt->bind_param("s", $student_id);
                $checkStmt->execute();
                $result = $checkStmt->get_result();
                if ($result->num_rows === 0) {
                    throw new Exception("Sinh viên không tồn tại: $student_id");
                }

                $stmt->bind_param("ss", $student_id, $room);
                $stmt->execute();
            }

            $conn->commit();
            Response::json(["success" => true, "message" => "Ghi điểm danh thành công"]);
        } catch (Exception $e) {
            $conn->rollback();
            Response::json(["error" => "Lỗi khi ghi điểm danh: " . $e->getMessage()], 500);
        } finally {
            if (isset($stmt)) $stmt->close();
            if (isset($checkStmt)) $checkStmt->close();
        }
        break;

    default:
        Response::json(["error" => "Invalid action"], 400);
}
?>