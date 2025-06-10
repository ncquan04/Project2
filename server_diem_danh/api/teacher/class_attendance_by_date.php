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
    
    // BƯỚC 1: Lấy danh sách sinh viên trong lớp học
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
    $studentIds = []; // Để lưu danh sách student_id
    while ($row = $studentsResult->fetch_assoc()) {
        $students[] = $row;
        $studentIds[] = $row['student_id'];
    }
    
    // BƯỚC 2: Xác định thời gian bắt đầu lớp học và khung thời gian hợp lệ
    $classStartTime = $date . ' ' . $classInfo['start_time'];
    $startWindow = date('Y-m-d H:i:s', strtotime($classStartTime . ' -60 minutes'));
    $endWindow = date('Y-m-d H:i:s', strtotime($classStartTime . ' +30 minutes'));
    
    $classStartDateTime = new DateTime($classStartTime);
    $endWindowDateTime = new DateTime($endWindow);
    $startWindowDateTime = new DateTime($startWindow);
    
    // BƯỚC 3: Tìm kiếm thông tin điểm danh của các sinh viên trong ngày đã chọn
    $attendanceData = [];
    $debugAttendanceDetails = [];
    $debugQueries = []; // Debug thông tin queries
    
    if (count($studentIds) > 0) {
        // Tạo placeholders cho IN clause
        $placeholders = str_repeat('?,', count($studentIds) - 1) . '?';
        
        // Query tìm tất cả bản ghi điểm danh của sinh viên trong khung thời gian
        $attendanceQuery = "SELECT a.attendance_id, a.student_id, a.checkin_time, a.notes, a.verified, a.status, 
                                  a.room, a.course_id
                           FROM attendance a
                           WHERE a.student_id IN ($placeholders)
                             AND DATE(a.checkin_time) = ?
                           ORDER BY a.student_id ASC, a.checkin_time DESC";
        
        $attendanceStmt = $conn->prepare($attendanceQuery);
        if (!$attendanceStmt) {
            throw new Exception("Prepare attendance statement failed: " . $conn->error);
        }
          // Bind parameters: student_ids + date
        $types = str_repeat('i', count($studentIds)) . 's';
        $params = array_merge($studentIds, [$date]);
        $attendanceStmt->bind_param($types, ...$params);
        $attendanceStmt->execute();
        $attendanceResult = $attendanceStmt->get_result();
          // Debug info về query
        $debugQueries[] = [
            'query_type' => 'find_attendance_by_students_and_date',
            'student_count' => count($studentIds),
            'student_ids' => $studentIds,
            'date' => $date,
            'query' => $attendanceQuery,
            'bind_types' => $types,
            'found_records' => $attendanceResult->num_rows
        ];
        
        // BƯỚC 4: Xử lý từng bản ghi điểm danh và đối chiếu với thời gian lớp học
        while ($attendance = $attendanceResult->fetch_assoc()) {
            $studentId = $attendance['student_id'];
            
            // Chỉ lấy bản ghi đầu tiên (mới nhất) cho mỗi sinh viên
            if (!isset($attendanceData[$studentId])) {
                $checkinDateTime = new DateTime($attendance['checkin_time']);
                
                // Kiểm tra xem bản ghi có trong khung thời gian hợp lệ không
                $isInTimeWindow = ($checkinDateTime >= $startWindowDateTime && $checkinDateTime <= $endWindowDateTime);
                
                if ($isInTimeWindow) {
                    // Tính toán trạng thái dựa trên thời gian so với giờ bắt đầu lớp
                    $minutesDiff = round(($checkinDateTime->getTimestamp() - $classStartDateTime->getTimestamp()) / 60);
                    $calculatedStatus = 'absent'; // Mặc định
                    
                    // Logic đối chiếu thời gian:
                    // - Có mặt: điểm danh trước hoặc đúng giờ bắt đầu lớp
                    // - Đi muộn: điểm danh sau giờ bắt đầu lớp nhưng trong khung thời gian cho phép
                    if ($checkinDateTime <= $classStartDateTime) {
                        $calculatedStatus = 'present';
                    } else if ($checkinDateTime <= $endWindowDateTime) {
                        $calculatedStatus = 'late';
                    }
                    
                    // Lưu thông tin debug
                    $debugAttendanceDetails[$studentId] = [
                        'checkin_time' => $attendance['checkin_time'],
                        'class_start_time' => $classStartDateTime->format('Y-m-d H:i:s'),
                        'minutes_difference' => $minutesDiff,
                        'is_in_time_window' => $isInTimeWindow,
                        'is_before_class_start' => ($checkinDateTime <= $classStartDateTime),
                        'calculated_status' => $calculatedStatus,
                        'original_status' => $attendance['status'],
                        'room_matched' => ($attendance['room'] === $classInfo['room']),
                        'course_matched' => ($attendance['course_id'] == $classInfo['course_id'])
                    ];
                    
                    $attendanceData[$studentId] = [
                        'attendance_id' => $attendance['attendance_id'],
                        'status' => $calculatedStatus,
                        'check_in_time' => $attendance['checkin_time'],
                        'notes' => $attendance['notes'],
                        'verified' => $attendance['verified'],
                        'original_status' => $attendance['status'],
                        'minutes_difference' => $minutesDiff
                    ];
                } else {
                    // Bản ghi ngoài khung thời gian hợp lệ
                    $debugAttendanceDetails[$studentId] = [
                        'checkin_time' => $attendance['checkin_time'],
                        'class_start_time' => $classStartDateTime->format('Y-m-d H:i:s'),
                        'is_in_time_window' => false,
                        'calculated_status' => 'out_of_time_window',
                        'original_status' => $attendance['status']
                    ];
                }
            }
        }
        
        if (isset($attendanceStmt)) $attendanceStmt->close();
    }// Thêm thông tin điểm danh vào danh sách sinh viên
    foreach ($students as &$student) {
        $studentId = $student['student_id'];
        if (isset($attendanceData[$studentId])) {
            $student['attendance'] = $attendanceData[$studentId];
        } else {
            // Sinh viên không có bản ghi điểm danh = vắng mặt
            $student['attendance'] = [
                'attendance_id' => null,
                'status' => 'absent',
                'check_in_time' => null,
                'notes' => null,
                'verified' => 0,
                'original_status' => null
            ];
        }
    }    Response::json([
        "success" => true,
        "date" => $date,
        "class" => $classInfo,
        "class_start_time" => $classInfo['start_time'],
        "time_window" => [
            "start" => $startWindow,
            "end" => $endWindow
        ],        "debug_info" => [
            "attendance_rules" => [
                "present_window" => "60 phút trước giờ bắt đầu đến đúng giờ bắt đầu",
                "late_window" => "Sau giờ bắt đầu đến " . round(($endWindowDateTime->getTimestamp() - $classStartDateTime->getTimestamp()) / 60) . " phút sau",
                "absent_cases" => "Không có bản ghi hoặc quá " . round(($endWindowDateTime->getTimestamp() - $classStartDateTime->getTimestamp()) / 60) . " phút sau giờ bắt đầu"
            ],
            "time_calculations" => [
                "class_start_datetime" => $classStartTime,
                "valid_checkin_start" => $startWindow . " (thời gian sớm nhất được phép điểm danh)",
                "valid_checkin_end" => $endWindow . " (thời gian muộn nhất được phép điểm danh)",
                "present_until" => $classStartTime . " (giờ bắt đầu lớp - giới hạn 'có mặt')",
                "late_until" => $endWindow . " (giới hạn 'đi muộn')",
                "window_duration_minutes" => round(($endWindowDateTime->getTimestamp() - $startWindowDateTime->getTimestamp()) / 60)
            ],            "statistics" => [
                "total_students" => count($students),
                "attendance_found" => count($attendanceData),
                "students_absent" => count($students) - count($attendanceData)
            ],
            "queries" => $debugQueries,
            "attendance_details" => $debugAttendanceDetails
        ],
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