<?php
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../config/config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(['success' => false, 'error' => 'Invalid request method'], 405);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    $data = $_POST;
}

$class_id = isset($data['class_id']) ? intval($data['class_id']) : 0;
$student_id = isset($data['student_id']) ? $data['student_id'] : null;
$date = isset($data['date']) ? $data['date'] : null;
$status = isset($data['status']) ? $data['status'] : null;

if (!$class_id || !$student_id || !$date || !$status) {
    Response::json(['success' => false, 'error' => 'Missing required fields'], 400);
    exit;
}

// Kết nối CSDL
$conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($conn->connect_error) {
    Response::json(['success' => false, 'error' => 'Database connection failed'], 500);
    exit;
}

// Lấy thông tin lớp để xác định room, course_id, start_time
$classStmt = $conn->prepare("SELECT room, course_id, start_time FROM classes WHERE class_id = ?");
$classStmt->bind_param('i', $class_id);
$classStmt->execute();
$classResult = $classStmt->get_result();
if ($classResult->num_rows === 0) {
    Response::json(['success' => false, 'error' => 'Class not found'], 404);
    exit;
}
$classInfo = $classResult->fetch_assoc();
$classStmt->close();

$room = $classInfo['room'];
$course_id = $classInfo['course_id'];
$start_time = $classInfo['start_time'];

// Ghép ngày và giờ bắt đầu buổi học
$checkin_time = $date . ' ' . $start_time;

// Thêm bản ghi điểm danh
$stmt = $conn->prepare("INSERT INTO attendance (student_id, checkin_time, room, course_id, status, verified, notes) VALUES (?, ?, ?, ?, ?, 1, '[Manual attendance]')");
$stmt->bind_param('sssis', $student_id, $checkin_time, $room, $course_id, $status);
$success = $stmt->execute();
if ($success) {
    Response::json(['success' => true, 'attendance_id' => $conn->insert_id]);
} else {
    Response::json(['success' => false, 'error' => $stmt->error], 500);
}
$stmt->close();
$conn->close();
