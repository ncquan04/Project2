<?php
// api/teacher/update_attendance.php
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';
require_once __DIR__ . '/../../config/config.php';

CORS::enableCORS();
header('Content-Type: application/json; charset=utf-8');
Session::start();

// Chỉ cho phép phương thức POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(["success" => false, "error" => "Method not allowed"], 405);
}

// Kiểm tra quyền giáo viên
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'teacher') {
    Response::json(["success" => false, "error" => "Unauthorized. Teacher role required."], 403);
}

// Lấy dữ liệu từ POST
$data = json_decode(file_get_contents('php://input'), true);
$attendanceId = isset($data['attendanceId']) ? intval($data['attendanceId']) : 0;
$status = isset($data['status']) ? $data['status'] : null;

// Nếu có truyền checkin_time mới từ frontend thì lấy, không thì để null
$newCheckinTime = isset($data['checkin_time']) ? $data['checkin_time'] : null;

// Nếu không có attendanceId hoặc attendanceId = 0 thì tạo mới bản ghi
if ($attendanceId <= 0) {
    $studentId = isset($data['student_id']) ? $data['student_id'] : null;
    $room = isset($data['room']) ? $data['room'] : null;
    $courseId = isset($data['course_id']) ? $data['course_id'] : null;
    $rfidUid = isset($data['rfid_uid']) ? $data['rfid_uid'] : null;
    $checkinTime = $newCheckinTime ? $newCheckinTime : (isset($data['checkin_time']) ? $data['checkin_time'] : null);
    if (!$studentId || !$room || !$courseId || !$checkinTime || !$status) {
        Response::json(["success" => false, "error" => "Missing required fields to create new attendance record"], 400);
    }
    $insertStmt = $conn->prepare("INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, course_id, verified, status, notes) VALUES (?, ?, ?, ?, ?, 1, ?, CONCAT('[Created by teacher at ', NOW(), ']'))");
    $insertStmt->bind_param("ssssis", $studentId, $rfidUid, $checkinTime, $room, $courseId, $status);
    $success = $insertStmt->execute();
    if ($success) {
        $newId = $conn->insert_id;
        $stmt = $conn->prepare("SELECT * FROM attendance WHERE attendance_id = ?");
        $stmt->bind_param("i", $newId);
        $stmt->execute();
        $attendanceData = $stmt->get_result()->fetch_assoc();
        Response::json([
            "success" => true,
            "message" => "Attendance created successfully.",
            "attendance" => $attendanceData
        ]);
    } else {
        Response::json(["success" => false, "error" => "Failed to create attendance record."]);
    }
    exit;
}

if ($attendanceId <= 0 || !$status) {
    Response::json(["success" => false, "error" => "Missing or invalid attendanceId or status"], 400);
}

// Kiểm tra kết nối DB
if (!$conn) {
    Response::json(["success" => false, "error" => "Database connection failed"], 500);
}

// Kiểm tra attendanceId có tồn tại không
$checkStmt = $conn->prepare("SELECT * FROM attendance WHERE attendance_id = ?");
$checkStmt->bind_param("i", $attendanceId);
$checkStmt->execute();
$result = $checkStmt->get_result();
if ($result->num_rows === 0) {
    // Nếu không tìm thấy, kiểm tra các trường cần thiết để tạo mới
    $studentId = isset($data['student_id']) ? $data['student_id'] : null;
    $room = isset($data['room']) ? $data['room'] : null;
    $courseId = isset($data['course_id']) ? $data['course_id'] : null;
    $rfidUid = isset($data['rfid_uid']) ? $data['rfid_uid'] : null;
    $checkinTime = $newCheckinTime ? $newCheckinTime : (isset($data['checkin_time']) ? $data['checkin_time'] : null);
    if (!$studentId || !$room || !$courseId || !$checkinTime) {
        Response::json(["success" => false, "error" => "Missing required fields to create new attendance record"], 400);
    }
    $insertStmt = $conn->prepare("INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, course_id, verified, status, notes) VALUES (?, ?, ?, ?, ?, 1, ?, '[Created by teacher at ' + NOW() + ']')");
    $insertStmt->bind_param("ssssis", $studentId, $rfidUid, $checkinTime, $room, $courseId, $status);
    $success = $insertStmt->execute();
    if ($success) {
        $newId = $conn->insert_id;
        $stmt = $conn->prepare("SELECT * FROM attendance WHERE attendance_id = ?");
        $stmt->bind_param("i", $newId);
        $stmt->execute();
        $attendanceData = $stmt->get_result()->fetch_assoc();
        Response::json([
            "success" => true,
            "message" => "Attendance created successfully.",
            "attendance" => $attendanceData
        ]);
    } else {
        Response::json(["success" => false, "error" => "Failed to create attendance record."]);
    }
    exit;
}
$attendanceRow = $result->fetch_assoc();

// Thêm kiểm tra: attendance_id phải thuộc về đúng student_id gửi lên (nếu có truyền student_id)
if (isset($data['student_id']) && $attendanceRow['student_id'] !== $data['student_id']) {
    Response::json(["success" => false, "error" => "attendance_id does not belong to the given student_id"], 400);
}

// Nếu có checkin_time mới từ frontend, luôn cập nhật checkin_time này
if ($newCheckinTime) {
    $updateStmt = $conn->prepare("UPDATE attendance SET verified = 1, notes = CONCAT(IFNULL(notes, ''), ' [Updated by teacher at ', NOW(), ']'), status = ?, checkin_time = ? WHERE attendance_id = ?");
    $updateStmt->bind_param("ssi", $status, $newCheckinTime, $attendanceId);
    $success = $updateStmt->execute();
} else {
    // Nếu không có checkin_time mới, dùng logic tự động sửa nếu cần
    if (($status === 'present' || $status === 'late')) {
        // Lấy thông tin lớp học để xác định giờ bắt đầu
        $classStmt = $conn->prepare("SELECT cl.start_time, cl.room, cl.class_id, cl.class_code FROM classes cl WHERE cl.course_id = ? AND cl.room = ?");
        $classStmt->bind_param("is", $attendanceRow['course_id'], $attendanceRow['room']);
        $classStmt->execute();
        $classInfo = $classStmt->get_result()->fetch_assoc();
        if ($classInfo && $attendanceRow['checkin_time']) {
            $date = substr($attendanceRow['checkin_time'], 0, 10);
            $classStartTime = $date . ' ' . $classInfo['start_time'];
            $startWindow = date('Y-m-d H:i:s', strtotime($classStartTime . ' -1 hour'));
            $endWindow = date('Y-m-d H:i:s', strtotime($classStartTime . ' +3 hour'));
            // Nếu checkin_time hiện tại không nằm trong khoảng hợp lệ, cập nhật lại
            if ($attendanceRow['checkin_time'] < $startWindow || $attendanceRow['checkin_time'] > $endWindow) {
                $autoCheckinTime = $classStartTime;
            }
        }
        // Nếu không có checkin_time, cũng cập nhật thành giờ bắt đầu buổi học
        if (!$attendanceRow['checkin_time']) {
            $date = date('Y-m-d');
            if ($classInfo && $classInfo['start_time']) {
                $autoCheckinTime = $date . ' ' . $classInfo['start_time'];
            } else {
                $autoCheckinTime = date('Y-m-d H:i:s');
            }
        }
    }
    if (isset($autoCheckinTime)) {
        $updateStmt = $conn->prepare("UPDATE attendance SET verified = 1, notes = CONCAT(IFNULL(notes, ''), ' [Updated by teacher at ', NOW(), ']'), status = ?, checkin_time = ? WHERE attendance_id = ?");
        $updateStmt->bind_param("ssi", $status, $autoCheckinTime, $attendanceId);
    } else {
        $updateStmt = $conn->prepare("UPDATE attendance SET verified = 1, notes = CONCAT(IFNULL(notes, ''), ' [Updated by teacher at ', NOW(), ']'), status = ? WHERE attendance_id = ?");
        $updateStmt->bind_param("si", $status, $attendanceId);
    }
    $success = $updateStmt->execute();
}

if ($success) {
    // Lấy lại dữ liệu attendance vừa update
    $stmt = $conn->prepare("SELECT * FROM attendance WHERE attendance_id = ?");
    $stmt->bind_param("i", $attendanceId);
    $stmt->execute();
    $attendanceData = $stmt->get_result()->fetch_assoc();
    Response::json([
        "success" => true,
        "message" => "Attendance updated successfully.",
        "attendance" => $attendanceData
    ]);
} else {
    Response::json(["success" => false, "error" => "Failed to update attendance."]);
}
