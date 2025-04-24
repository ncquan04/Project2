<?php
// api/teacher/classes.php
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../config/config.php';

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

// Kiểm tra kết nối cơ sở dữ liệu
if (!$conn) {
    Response::json(["success" => false, "error" => "Database connection failed"], 500);
    exit;
}

// Lọc theo học kỳ (nếu có)
$semester = isset($_GET['semester']) ? $_GET['semester'] : null;
$active = isset($_GET['active']) ? filter_var($_GET['active'], FILTER_VALIDATE_BOOLEAN) : null;

try {
    // Xây dựng câu truy vấn
    $query = "SELECT cl.class_id, c.course_name, c.course_code, cl.class_code, cl.semester, 
                     cl.schedule_day, cl.start_time, cl.end_time, cl.room,
                     cl.start_date, cl.end_date, cl.created_at,
                     (SELECT COUNT(*) FROM student_classes sc WHERE sc.class_id = cl.class_id) as student_count
              FROM classes cl
              JOIN courses c ON cl.course_id = c.course_id
              WHERE cl.teacher_id = ?";

    $params = [$teacher_id];
    $types = "i";

    if ($semester !== null) {
        $query .= " AND cl.semester = ?";
        $params[] = $semester;
        $types .= "s";
    }

    if ($active !== null) {
        // Check active status based on current date and class end_date
        if ($active) {
            $query .= " AND cl.end_date >= CURDATE()";
        } else {
            $query .= " AND cl.end_date < CURDATE()";
        }
    }

    $query .= " ORDER BY cl.semester DESC, c.course_name ASC";

    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $classes = [];
    while ($row = $result->fetch_assoc()) {
        $classes[] = $row;
    }

    Response::json([
        "success" => true,
        "classes" => $classes,
        "count" => count($classes)
    ], 200);

} catch (Exception $e) {
    Response::json(["success" => false, "error" => "Lỗi server: " . $e->getMessage()], 500);
} finally {
    if (isset($stmt)) {
        $stmt->close();
    }
}