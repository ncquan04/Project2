<?php
// api/admin/classes.php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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
        $stmt = $conn->query("SELECT c.class_id, c.class_code, c.room, c.course_id, c.teacher_id, c.semester, c.schedule_day, c.start_time, c.end_time, c.start_date, c.end_date, co.course_name, co.course_code as course_code_ref FROM classes c LEFT JOIN courses co ON c.course_id = co.course_id");
        $classes = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "classes" => $classes]);
        break;    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_code'], $data['course_id'], $data['teacher_id'], $data['room'], $data['semester'], $data['schedule_day'], $data['start_time'], $data['end_time'], $data['start_date'], $data['end_date'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO classes (class_code, course_id, teacher_id, room, semester, schedule_day, start_time, end_time, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("siisssssss", $data['class_code'], $data['course_id'], $data['teacher_id'], $data['room'], $data['semester'], $data['schedule_day'], $data['start_time'], $data['end_time'], $data['start_date'], $data['end_date']);
        if ($stmt->execute()) {
            Response::json(["success" => true]);
        } else {
            Response::json(["error" => "Failed to create class: " . $stmt->error], 500);
        }
        break;    case 'edit':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'], $data['class_code'], $data['course_id'], $data['teacher_id'], $data['room'], $data['semester'], $data['schedule_day'], $data['start_time'], $data['end_time'], $data['start_date'], $data['end_date'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("UPDATE classes SET class_code=?, course_id=?, teacher_id=?, room=?, semester=?, schedule_day=?, start_time=?, end_time=?, start_date=?, end_date=? WHERE class_id=?");
        $stmt->bind_param("siissssssi", $data['class_code'], $data['course_id'], $data['teacher_id'], $data['room'], $data['semester'], $data['schedule_day'], $data['start_time'], $data['end_time'], $data['start_date'], $data['end_date'], $data['class_id']);
        if ($stmt->execute()) {
            Response::json(["success" => true]);
        } else {
            Response::json(["error" => "Failed to update class: " . $stmt->error], 500);
        }
        break;    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'])) {
            Response::json(["error" => "Missing class_id"], 400);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM classes WHERE class_id=?");
        $stmt->bind_param("i", $data['class_id']);
        if ($stmt->execute()) {
            Response::json(["success" => true]);
        } else {
            Response::json(["error" => "Failed to delete class: " . $stmt->error], 500);        }
        break;    case 'getStudents':
        $classId = $_GET['class_id'] ?? '';
        if (!$classId) {
            Response::json(["error" => "Missing class_id"], 400);
            exit;
        }
        $stmt = $conn->prepare("SELECT s.student_id, s.full_name, s.email, sc.enrolled_date as enrollment_date 
                               FROM student_classes sc 
                               JOIN students s ON sc.student_id = s.student_id 
                               WHERE sc.class_id = ? 
                               ORDER BY s.student_id");
        $stmt->bind_param("i", $classId);
        $stmt->execute();
        $students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // Add student_code field (using student_id as student_code since they appear to be the same)
        foreach ($students as &$student) {
            $student['student_code'] = $student['student_id'];
        }
        
        Response::json(["success" => true, "students" => $students]);
        break;

    case 'addStudent':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'], $data['student_id'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        
        // Check if student is already enrolled
        $checkStmt = $conn->prepare("SELECT id FROM student_classes WHERE class_id = ? AND student_id = ?");
        $checkStmt->bind_param("is", $data['class_id'], $data['student_id']);
        $checkStmt->execute();
        if ($checkStmt->get_result()->num_rows > 0) {
            Response::json(["error" => "Sinh viên đã có trong lớp"], 400);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO student_classes (class_id, student_id, enrolled_date) VALUES (?, ?, NOW())");
        $stmt->bind_param("is", $data['class_id'], $data['student_id']);
        if ($stmt->execute()) {
            Response::json(["success" => true]);
        } else {
            Response::json(["error" => "Failed to add student to class: " . $stmt->error], 500);
        }
        break;

    case 'removeStudent':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'], $data['student_id'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM student_classes WHERE class_id = ? AND student_id = ?");
        $stmt->bind_param("is", $data['class_id'], $data['student_id']);
        if ($stmt->execute()) {
            Response::json(["success" => true]);
        } else {
            Response::json(["error" => "Failed to remove student from class: " . $stmt->error], 500);
        }
        break;

    default:
        Response::json(["error" => "Invalid action"], 400);
}

$conn->close();
