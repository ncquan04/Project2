<?php
// api/admin/rooms.php
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
        $stmt = $conn->query("SELECT * FROM rooms");
        $rooms = $stmt->fetch_all(MYSQLI_ASSOC);
        Response::json(["success" => true, "rooms" => $rooms]);
        break;
    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['room_id'], $data['room_name'], $data['capacity'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("INSERT INTO rooms (room_id, room_name, capacity) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $data['room_id'], $data['room_name'], $data['capacity']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    case 'edit':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['room_id'], $data['room_name'], $data['capacity'])) {
            Response::json(["error" => "Missing required fields"], 400);
            exit;
        }
        $stmt = $conn->prepare("UPDATE rooms SET room_name=?, capacity=? WHERE room_id=?");
        $stmt->bind_param("sis", $data['room_name'], $data['capacity'], $data['room_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    case 'delete':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['room_id'])) {
            Response::json(["error" => "Missing room_id"], 400);
            exit;
        }
        $stmt = $conn->prepare("DELETE FROM rooms WHERE room_id=?");
        $stmt->bind_param("s", $data['room_id']);
        $stmt->execute();
        Response::json(["success" => true]);
        break;
    default:
        Response::json(["error" => "Invalid action"], 400);
}

$conn->close();
