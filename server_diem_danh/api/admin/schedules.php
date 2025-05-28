<?php
// api/admin/schedules.php
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
        $stmt = $conn->query("SELECT * FROM schedules");
        $schedules = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "schedules" => $schedules]);
        break;
    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['schedule_id'], $data['class_id'], $data['room_id'], $data['date'], $data['start_time'], $data['end_time'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO schedules (schedule_id, class_id, room_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $data['schedule_id'], $data['class_id'], $data['room_id'], $data['date'], $data['start_time'], $data['end_time']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    case 'edit':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['schedule_id'], $data['class_id'], $data['room_id'], $data['date'], $data['start_time'], $data['end_time'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("UPDATE schedules SET class_id=?, room_id=?, date=?, start_time=?, end_time=? WHERE schedule_id=?");
        $stmt->bind_param("ssssss", $data['class_id'], $data['room_id'], $data['date'], $data['start_time'], $data['end_time'], $data['schedule_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['schedule_id'])) {
            Response::json(["error" => "Missing schedule_id"], 400);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM schedules WHERE schedule_id=?");
        $stmt->bind_param("s", $data['schedule_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    default:
        Response::json(["error" => "Invalid action"], 400);
}

$conn->close();
