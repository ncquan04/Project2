<?php
// api/admin/classes.php
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
        $stmt = $conn->query("SELECT c.class_id, c.class_code, c.room, c.course_id, c.start_time, c.schedule_day, co.course_name AS class_name FROM classes c LEFT JOIN courses co ON c.course_id = co.course_id");
        $classes = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "classes" => $classes]);
        break;
    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'], $data['class_name'], $data['room'], $data['course_id'], $data['start_time'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO classes (class_id, class_name, room, course_id, start_time) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssis", $data['class_id'], $data['class_name'], $data['room'], $data['course_id'], $data['start_time']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    case 'edit':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'], $data['class_name'], $data['room'], $data['course_id'], $data['start_time'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("UPDATE classes SET class_name=?, room=?, course_id=?, start_time=? WHERE class_id=?");
        $stmt->bind_param("ssiss", $data['class_name'], $data['room'], $data['course_id'], $data['start_time'], $data['class_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['class_id'])) {
            Response::json(["error" => "Missing class_id"], 400);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM classes WHERE class_id=?");
        $stmt->bind_param("s", $data['class_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    default:
        Response::json(["error" => "Invalid action"], 400);
}

$conn->close();
