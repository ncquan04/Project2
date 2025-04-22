<?php
// api/admin/students.php
require_once __DIR__ . '/../../config/config.php'; // Kết nối database
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';

// Khởi động session
Session::start();

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
        }
        $stmt = $conn->query("SELECT student_id, full_name, class, rfid_uid FROM students");
        $students = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "students" => $students]);
        break;

    case 'add':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['student_id'], $data['full_name'], $data['class'], $data['rfid_uid'])) {
            Response::json(["error" => "Missing required fields"], 400);
        }
        $stmt = $conn->prepare("SELECT student_id FROM students WHERE student_id = ?");
        $stmt->bind_param("s", $data['student_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            Response::json(["error" => "Mã sinh viên đã tồn tại"], 409);
        }
        $stmt = $conn->prepare("INSERT INTO students (student_id, full_name, class, rfid_uid) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $data['student_id'], $data['full_name'], $data['class'], $data['rfid_uid']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;

    case 'edit':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['student_id'], $data['full_name'], $data['class'], $data['rfid_uid'])) {
            Response::json(["error" => "Missing required fields"], 400);
        }
        $stmt = $conn->prepare("UPDATE students SET full_name = ?, class = ?, rfid_uid = ? WHERE student_id = ?");
        $stmt->bind_param("ssss", $data['full_name'], $data['class'], $data['rfid_uid'], $data['student_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;

    case 'delete':
        if ($_SESSION['role'] !== 'admin') {
            Response::json(["error" => "Unauthorized"], 403);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['student_id'])) {
            Response::json(["error" => "Missing student_id"], 400);
        }
        $stmt = $conn->prepare("DELETE FROM students WHERE student_id = ?");
        $stmt->bind_param("s", $data['student_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;

    case 'attendance':
        $filters = json_decode(file_get_contents('php://input'), true);
        $query = "SELECT attendance_id, student_id, rfid_uid, checkin_time, room FROM attendance WHERE 1=1";
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

    default:
        Response::json(["error" => "Invalid action"], 400);
}