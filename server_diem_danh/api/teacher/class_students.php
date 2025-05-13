<?php
// api/teacher/class_students.php
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';
require_once __DIR__ . '/../../config/config.php';

// Kích hoạt CORS
CORS::enableCORS();

// Khởi động session
Session::start();

// Kh?i d?ng session
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
    $checkClassStmt = $conn->prepare("SELECT class_id FROM classes WHERE class_id = ? AND teacher_id = ?");
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
    
    // Lấy thông tin lớp học
    $classInfoStmt = $conn->prepare(
        "SELECT cl.class_id, cl.class_code, c.course_name, c.course_code, cl.semester, cl.schedule_day, 
                cl.start_time, cl.end_time, cl.room, cl.start_date, cl.end_date 
         FROM classes cl
         JOIN courses c ON cl.course_id = c.course_id
         WHERE cl.class_id = ?"
    );
    $classInfoStmt->bind_param("i", $class_id);
    $classInfoStmt->execute();
    $classInfo = $classInfoStmt->get_result()->fetch_assoc();
    
    // Truy vấn danh sách sinh viên trong lớp học
    $query = "SELECT s.student_id, s.full_name, s.class AS student_class, s.rfid_uid
              FROM students s
              JOIN student_classes sc ON s.student_id = sc.student_id
              WHERE sc.class_id = ?
              ORDER BY s.student_id ASC";
    
    $stmt = $conn->prepare($query);
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    
    $stmt->bind_param("i", $class_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $students[] = $row;
    }
    
    Response::json([
        "success" => true,
        "class" => $classInfo,
        "students" => $students,
        "count" => count($students)
    ], 200);

} catch (Exception $e) {
    Response::json(["success" => false, "error" => "Lỗi server: " . $e->getMessage()], 500);
} finally {
    if (isset($checkClassStmt)) {
        $checkClassStmt->close();
    }
    if (isset($classInfoStmt)) {
        $classInfoStmt->close();
    }
    if (isset($stmt)) {
        $stmt->close();
    }
}
