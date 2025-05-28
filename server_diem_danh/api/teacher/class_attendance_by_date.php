<?php
// api/teacher/class_attendance_by_date.php
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';
require_once __DIR__ . '/../../config/config.php';

// Kích hoạt CORS - Luôn đặt CORS trước mọi xử lý khác
CORS::enableCORS();

// Set Content-Type header
header('Content-Type: application/json; charset=utf-8');

// Khởi động session
Session::start();

// Kiểm tra quyền giáo viên
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'teacher') {
    Response::json(["success" => false, "error" => "Unauthorized. Teacher role required."], 403);
    exit;
}

// Lấy teacher_id từ session
$teacher_id = $_SESSION['teacher_id'] ?? null;

if (!$teacher_id) {
    Response::json(["success" => false, "error" => "Session does not contain teacher_id"], 401);
    exit;
}

// Lấy class_id và date từ tham số URL
$class_id = isset($_GET['classId']) ? intval($_GET['classId']) : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;

if (!$class_id || !$date) {
    Response::json(["success" => false, "error" => "Missing required parameters: classId and date"], 400);
    exit;
}

// Xác thực ngày tháng
$date_obj = DateTime::createFromFormat('Y-m-d', $date);
if (!$date_obj || $date_obj->format('Y-m-d') !== $date) {
    Response::json(["success" => false, "error" => "Invalid date format. Use YYYY-MM-DD"], 400);
    exit;
}

try {
    // Kết nối đến cơ sở dữ liệu
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }

    // Kiểm tra quyền giáo viên với lớp học
    $checkClassStmt = $conn->prepare("SELECT cl.*, c.course_name 
                                    FROM classes cl
                                    JOIN courses c ON cl.course_id = c.course_id
                                    WHERE cl.class_id = ? AND cl.teacher_id = ?");
    if (!$checkClassStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    
    $checkClassStmt->bind_param("ii", $class_id, $teacher_id);
    $checkClassStmt->execute();
    $checkResult = $checkClassStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        Response::json([
            "success" => false, 
            "error" => "Không có quyền truy cập vào lớp học này hoặc lớp học không tồn tại"
        ], 403);
        exit;
    }
    
    $classInfo = $checkResult->fetch_assoc();
    
    // Lấy danh sách sinh viên trong lớp, đồng thời lấy tên lớp từ bảng classescd
    $studentsStmt = $conn->prepare("SELECT s.student_id, s.full_name, cl.class_code AS student_class, s.rfid_uid 
                                   FROM students s 
                                   JOIN student_classes sc ON s.student_id = sc.student_id 
                                   JOIN classes cl ON sc.class_id = cl.class_id
                                   WHERE sc.class_id = ? 
                                   ORDER BY s.student_id");
    $studentsStmt->bind_param("i", $class_id);
    $studentsStmt->execute();
    $studentsResult = $studentsStmt->get_result();
    
    $students = [];
    while ($row = $studentsResult->fetch_assoc()) {
        $students[] = $row;
    }
    
    // Lấy dữ liệu điểm danh cho ngày được chọn
    // Xác định khoảng thời gian hợp lệ cho buổi học (ví dụ: từ 1 tiếng trước đến 3 tiếng sau giờ bắt đầu)
    $classStartTime = $date . ' ' . $classInfo['start_time'];
    $startWindow = date('Y-m-d H:i:s', strtotime($classStartTime . ' -1 hour'));
    $endWindow = date('Y-m-d H:i:s', strtotime($classStartTime . ' +3 hour'));

    // Sửa: lấy cả attendance_id và sắp xếp checkin_time DESC để lấy bản ghi mới nhất trước
    $attendanceQuery = "SELECT a.attendance_id, a.student_id, a.checkin_time, a.notes, a.verified, a.status
                       FROM attendance a
                       WHERE a.room = ?
                         AND a.course_id = ?
                         AND a.checkin_time >= ?
                         AND a.checkin_time <= ?
                       ORDER BY a.student_id ASC, a.checkin_time DESC";
    $attendanceStmt = $conn->prepare($attendanceQuery);
    $attendanceStmt->bind_param("ssss", $classInfo['room'], $classInfo['course_id'], $startWindow, $endWindow);
    $attendanceStmt->execute();
    $attendanceResult = $attendanceStmt->get_result();

    // Tổ chức dữ liệu điểm danh: lấy bản ghi mới nhất cho mỗi student_id
    $attendanceData = [];
    while ($attendance = $attendanceResult->fetch_assoc()) {
        $studentId = $attendance['student_id'];
        if (!isset($attendanceData[$studentId])) {
            $attendanceData[$studentId] = [
                'attendance_id' => $attendance['attendance_id'],
                'status' => $attendance['status'] ?? 'present',
                'check_in_time' => $attendance['checkin_time'],
                'notes' => $attendance['notes'],
                'verified' => $attendance['verified']
            ];
        }
    }

    // Thêm thông tin điểm danh vào danh sách sinh viên
    foreach ($students as &$student) {
        $studentId = $student['student_id'];
        if (isset($attendanceData[$studentId])) {
            $student['attendance'] = $attendanceData[$studentId];
        } else {
            $student['attendance'] = [
                'attendance_id' => null,
                'status' => 'absent',
                'check_in_time' => null,
                'notes' => null,
                'verified' => 0
            ];
        }
    }
    
    Response::json([
        "success" => true,
        "date" => $date,
        "class" => $classInfo,
        "students" => $students
    ], 200);

} catch (Exception $e) {
    Response::json(["success" => false, "error" => "Lỗi server: " . $e->getMessage()], 500);
} finally {
    if (isset($checkClassStmt)) $checkClassStmt->close();
    if (isset($studentsStmt)) $studentsStmt->close();
    if (isset($attendanceStmt)) $attendanceStmt->close();
    if (isset($conn)) $conn->close();
}
?>