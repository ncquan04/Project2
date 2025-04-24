<?php
// api/teacher/attendance_report.php
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

// Lấy class_id từ tham số URL
$class_id = isset($_GET['class_id']) ? intval($_GET['class_id']) : 0;
$semester = isset($_GET['semester']) ? $_GET['semester'] : null;
$week_number = isset($_GET['week']) ? intval($_GET['week']) : null;

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
    $checkClassStmt = $conn->prepare("SELECT cl.class_id, cl.class_code, c.course_name, c.course_code, 
                                        cl.semester, cl.schedule_day, cl.start_time, cl.end_time, cl.room,
                                        cl.start_date, cl.end_date
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
    
    // Lấy dữ liệu điểm danh theo tuần (YEARWEEK để lấy số tuần trong năm)
    $weekQuery = "SELECT DISTINCT YEARWEEK(checkin_time) as week_number 
                 FROM attendance a
                 JOIN classes cl ON cl.course_id = a.course_id AND cl.room = a.room
                 WHERE cl.class_id = ? 
                 ORDER BY week_number ASC";
    
    $weekStmt = $conn->prepare($weekQuery);
    $weekStmt->bind_param("i", $class_id);
    $weekStmt->execute();
    $weekResult = $weekStmt->get_result();
    
    $weeks = [];
    while ($weekRow = $weekResult->fetch_assoc()) {
        $weeks[] = $weekRow['week_number'];
    }
    
    // Nếu không có tuần nào, trả về danh sách trống
    if (empty($weeks)) {
        Response::json([
            "success" => true,
            "class" => $classInfo,
            "message" => "Chưa có dữ liệu điểm danh cho lớp này",
            "students" => [],
            "weeks" => [],
            "attendance_data" => []
        ], 200);
        exit;
    }
    
    // Nếu không chỉ định tuần cụ thể, lấy tuần mới nhất
    if ($week_number === null) {
        $week_number = max($weeks);
    } elseif (!in_array($week_number, $weeks)) {
        Response::json([
            "success" => false,
            "error" => "Không tìm thấy dữ liệu điểm danh cho tuần $week_number"
        ], 404);
        exit;
    }
    
    // Lấy danh sách sinh viên trong lớp
    $studentsQuery = "SELECT s.student_id, s.full_name, s.class AS student_class
                     FROM students s
                     JOIN student_classes sc ON s.student_id = sc.student_id
                     WHERE sc.class_id = ?
                     ORDER BY s.student_id ASC";
    
    $studentsStmt = $conn->prepare($studentsQuery);
    $studentsStmt->bind_param("i", $class_id);
    $studentsStmt->execute();
    $studentsResult = $studentsStmt->get_result();
    
    $students = [];
    while ($row = $studentsResult->fetch_assoc()) {
        $students[] = $row;
    }
    
    // Lấy dữ liệu điểm danh cho tuần được chọn
    $attendanceQuery = "SELECT a.student_id, DATE(a.checkin_time) AS class_date, 
                              a.checkin_time, a.notes, a.verified,
                              cl.schedule_day, cl.start_time, cl.end_time, cl.room
                       FROM attendance a
                       JOIN classes cl ON a.course_id = cl.course_id
                       WHERE cl.class_id = ? AND YEARWEEK(a.checkin_time) = ?
                       ORDER BY a.checkin_time ASC, a.student_id ASC";
    
    $attendanceStmt = $conn->prepare($attendanceQuery);
    $attendanceStmt->bind_param("ii", $class_id, $week_number);
    $attendanceStmt->execute();
    $attendanceResult = $attendanceStmt->get_result();
    
    // Tổ chức dữ liệu điểm danh theo cấu trúc dễ sử dụng
    $attendanceData = [];
    $classDates = [];
    
    while ($attendance = $attendanceResult->fetch_assoc()) {
        $date = $attendance['class_date'];
        $studentId = $attendance['student_id'];
        
        if (!in_array($date, $classDates)) {
            $classDates[] = $date;
        }
        
        if (!isset($attendanceData[$studentId])) {
            $attendanceData[$studentId] = [];
        }
        
        // Xác định trạng thái điểm danh (present/late/absent) dựa vào thời gian
        $status = 'present';
        $checkInTime = new DateTime($attendance['checkin_time']);
        $classStartTime = new DateTime($date . ' ' . $attendance['start_time']);
        
        // Nếu điểm danh muộn 15 phút hoặc hơn, đánh dấu là late
        $lateThreshold = clone $classStartTime;
        $lateThreshold->add(new DateInterval('PT15M'));
        
        if ($checkInTime > $lateThreshold) {
            $status = 'late';
        }
        
        $attendanceData[$studentId][$date] = [
            'status' => $status,
            'check_in_time' => $attendance['checkin_time'],
            'notes' => $attendance['notes'],
            'verified' => $attendance['verified'],
            'room' => $attendance['room']
        ];
    }
    
    // Thêm thông tin tổng hợp cho mỗi học sinh
    foreach ($students as &$student) {
        $studentId = $student['student_id'];
        $student['attendance_summary'] = [
            'present' => 0,
            'absent' => 0,
            'late' => 0,
            'total_classes' => count($classDates)
        ];
        
        foreach ($classDates as $date) {
            if (isset($attendanceData[$studentId][$date])) {
                $status = $attendanceData[$studentId][$date]['status'];
                
                if ($status === 'present') {
                    $student['attendance_summary']['present']++;
                } elseif ($status === 'late') {
                    $student['attendance_summary']['late']++;
                }
            } else {
                $student['attendance_summary']['absent']++;
            }
        }
    }
    
    Response::json([
        "success" => true,
        "class" => $classInfo,
        "students" => $students,
        "week_number" => $week_number,
        "class_dates" => $classDates,
        "weeks" => $weeks,
        "attendance_data" => $attendanceData
    ], 200);

} catch (Exception $e) {
    Response::json(["success" => false, "error" => "Lỗi server: " . $e->getMessage()], 500);
} finally {
    if (isset($checkClassStmt)) {
        $checkClassStmt->close();
    }
    if (isset($weekStmt)) {
        $weekStmt->close();
    }
    if (isset($studentsStmt)) {
        $studentsStmt->close();
    }
    if (isset($attendanceStmt)) {
        $attendanceStmt->close();
    }
}