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
    $classId = isset($data['class_id']) ? $data['class_id'] : null;
    $rfidUid = isset($data['rfid_uid']) ? $data['rfid_uid'] : null;
    $checkinTime = $newCheckinTime ? $newCheckinTime : (isset($data['checkin_time']) ? $data['checkin_time'] : null);
    
    if (!$studentId || !$room || !$classId || !$checkinTime || !$status) {
        Response::json(["success" => false, "error" => "Missing required fields to create new attendance record"], 400);
    }
    
    // Kiểm tra class_id có tồn tại trong bảng classes không và lấy course_id
    $classCheckStmt = $conn->prepare("SELECT course_id FROM classes WHERE class_id = ?");
    $classCheckStmt->bind_param("i", $classId);
    $classCheckStmt->execute();
    $classResult = $classCheckStmt->get_result();
    if ($classResult->num_rows === 0) {
        Response::json(["success" => false, "error" => "Invalid class_id. Class does not exist."], 400);
    }
    $classRow = $classResult->fetch_assoc();
    $courseId = $classRow['course_id'];
    
    // Kiểm tra student_id có tồn tại trong bảng students không
    $studentCheckStmt = $conn->prepare("SELECT student_id FROM students WHERE student_id = ?");
    $studentCheckStmt->bind_param("s", $studentId);
    $studentCheckStmt->execute();
    $studentResult = $studentCheckStmt->get_result();
    if ($studentResult->num_rows === 0) {
        Response::json(["success" => false, "error" => "Invalid student_id. Student does not exist."], 400);
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
    $classId = isset($data['class_id']) ? $data['class_id'] : null;
    $rfidUid = isset($data['rfid_uid']) ? $data['rfid_uid'] : null;
    $checkinTime = $newCheckinTime ? $newCheckinTime : (isset($data['checkin_time']) ? $data['checkin_time'] : null);
    
    if (!$studentId || !$room || !$classId || !$checkinTime) {
        Response::json(["success" => false, "error" => "Missing required fields to create new attendance record"], 400);
    }
    
    // Kiểm tra class_id có tồn tại trong bảng classes không và lấy course_id
    $classCheckStmt = $conn->prepare("SELECT course_id FROM classes WHERE class_id = ?");
    $classCheckStmt->bind_param("i", $classId);
    $classCheckStmt->execute();
    $classResult = $classCheckStmt->get_result();
    if ($classResult->num_rows === 0) {
        Response::json(["success" => false, "error" => "Invalid class_id. Class does not exist."], 400);
    }
    $classRow = $classResult->fetch_assoc();
    $courseId = $classRow['course_id'];
    
    // Kiểm tra student_id có tồn tại trong bảng students không
    $studentCheckStmt = $conn->prepare("SELECT student_id FROM students WHERE student_id = ?");
    $studentCheckStmt->bind_param("s", $studentId);
    $studentCheckStmt->execute();
    $studentResult = $studentCheckStmt->get_result();
    if ($studentResult->num_rows === 0) {
        Response::json(["success" => false, "error" => "Invalid student_id. Student does not exist."], 400);
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
        // Lấy thông tin lớp học thông qua course_id và room từ attendance
        $classStmt = $conn->prepare("SELECT cl.start_time, cl.room, cl.class_id, cl.class_code FROM classes cl WHERE cl.course_id = ? AND cl.room = ?");
        $classStmt->bind_param("is", $attendanceRow['course_id'], $attendanceRow['room']);
        $classStmt->execute();
        $classInfo = $classStmt->get_result()->fetch_assoc();
        
        if ($classInfo && $classInfo['start_time']) {
            // Lấy ngày từ checkin_time hiện tại hoặc ngày hiện tại
            $date = $attendanceRow['checkin_time'] ? substr($attendanceRow['checkin_time'], 0, 10) : date('Y-m-d');
            $classStartTime = $date . ' ' . $classInfo['start_time'];
            
            // Tính thời gian check-in theo trạng thái
            if ($status === 'present') {
                // Có mặt: thời gian vào lớp - 5 phút
                $autoCheckinTime = date('Y-m-d H:i:s', strtotime($classStartTime . ' -5 minutes'));
            } else if ($status === 'late') {
                // Đi muộn: thời gian vào lớp + 5 phút
                $autoCheckinTime = date('Y-m-d H:i:s', strtotime($classStartTime . ' +5 minutes'));
            }
        } else {
            // Nếu không tìm được thông tin lớp, dùng thời gian hiện tại
            $autoCheckinTime = date('Y-m-d H:i:s');
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
