<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

require_once __DIR__ . '/../../config/config.php'; // Kết nối database
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';

// Khởi động session và CORS
Session::start();
CORS::enableCORS();

// Kiểm tra quyền admin
if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'manager'])) {
    Response::json(["error" => "Unauthorized"], 403);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(['error' => 'Method Not Allowed'], 405);
    exit;
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['students']) || !is_array($data['students'])) {
    Response::json(['error' => 'Invalid data'], 400);
    exit;
}

$students = $data['students'];
$success_count = 0;
$fail_count = 0;
$errors = [];

$conn->begin_transaction();

try {
    foreach ($students as $student) {
        try {
            // Handle empty RFID UID to avoid unique constraint issues
            $rfid_uid = isset($student['rfid_uid']) && !empty(trim($student['rfid_uid'])) ? trim($student['rfid_uid']) : null;
            
            $stmt = $conn->prepare("INSERT INTO students (student_id, rfid_uid, full_name, class) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $student['student_id'], $rfid_uid, $student['full_name'], $student['class']);
            $stmt->execute();

            $password_hash = password_hash($student['student_id'], PASSWORD_BCRYPT);
            $stmt = $conn->prepare("INSERT INTO users (username, password, role, student_id) VALUES (?, ?, 'student', ?)");
            $stmt->bind_param("sss", $student['student_id'], $password_hash, $student['student_id']);
            $stmt->execute();

            $success_count++;
        } catch (mysqli_sql_exception $e) {
            if ($e->getCode() == 1062) {
                $errors[] = "Sinh viên {$student['student_id']} đã tồn tại.";
                $fail_count++;
            } else {
                throw $e;
            }        }
    }
    
    $conn->commit();
    Response::json([
        'success' => true,
        'message' => "Đã import thành công $success_count sinh viên. $fail_count sinh viên không được import do trùng lặp.",
        'added_count' => $success_count,
        'failed_count' => $fail_count,
        'errors' => $errors
    ]);
} catch (Exception $e) {
    $conn->rollback();
    Response::json(['success' => false, 'message' => $e->getMessage()], 500);
}
?>
}

$conn->close();
?>