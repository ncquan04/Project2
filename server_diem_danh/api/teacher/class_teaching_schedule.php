<?php
// api/teacher/class_teaching_schedule.php
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';
require_once __DIR__ . '/../../config/config.php';

// Kích hoạt CORS
CORS::enableCORS();

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

// Lấy class_id từ tham số URL
$class_id = isset($_GET['class_id']) ? intval($_GET['class_id']) : 0;
if ($class_id <= 0) {
    Response::json(["success" => false, "error" => "Invalid class ID"], 400);
    exit;
}

// Kiểm tra kết nối cơ sở dữ liệu
if (!$conn) {
    Response::json(["success" => false, "error" => "Database connection failed"], 500);
    exit;
}

try {
    // Kiểm tra xem lớp học có thuộc về giáo viên này không
    $checkClassStmt = $conn->prepare("SELECT cl.class_id, cl.class_code, cl.room, cl.semester, cl.schedule_day, cl.start_time, cl.end_time, cl.start_date, cl.end_date, c.course_name, c.course_code FROM classes cl JOIN courses c ON cl.course_id = c.course_id WHERE cl.class_id = ? AND cl.teacher_id = ?");
    if (!$checkClassStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    $checkClassStmt->bind_param("ii", $class_id, $teacher_id);
    $checkClassStmt->execute();
    $result = $checkClassStmt->get_result();
    if ($result->num_rows === 0) {
        Response::json([
            "success" => false,
            "error" => "Không có quyền truy cập vào lớp học này hoặc lớp học không tồn tại"
        ], 403);
        exit;
    }
    $class = $result->fetch_assoc();
    $checkClassStmt->close();

    // Định dạng dữ liệu trả về cho frontend
    $weekdays = [
        'monday' => 'Thứ Hai',
        'tuesday' => 'Thứ Ba',
        'wednesday' => 'Thứ Tư',
        'thursday' => 'Thứ Năm',
        'friday' => 'Thứ Sáu',
        'saturday' => 'Thứ Bảy',
        'sunday' => 'Chủ Nhật'
    ];
    $schedule_vi = $weekdays[$class['schedule_day']] . ' (' . substr($class['start_time'], 0, 5) . ' - ' . substr($class['end_time'], 0, 5) . ')';

    $classInfo = [
        'id' => (int)$class['class_id'],
        'name' => $class['class_code'],
        'subject' => $class['course_name'],
        'subjectCode' => $class['course_code'],
        'schedule' => $schedule_vi,
        'room' => $class['room'],
        'semester' => $class['semester'],
        'startDate' => $class['start_date'],
        'endDate' => $class['end_date'],
        'start_time' => $class['start_time'], // thêm trường này
        'end_time' => $class['end_time'],     // thêm trường này
    ];

    Response::json($classInfo);
} catch (Exception $e) {
    Response::json(["success" => false, "error" => "Lỗi server: " . $e->getMessage()], 500);
}
