<?php
// api/student/classAttendance.php
require_once __DIR__ . '/../../config/config.php'; // Kết nối database
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php';

// Bật CORS
CORS::enableCORS();

// Lấy student_id từ tham số URL
$student_id = $_GET['student_id'] ?? '';
if (empty($student_id)) {
    Response::json(["error" => "Thiếu student_id"], 400);
    exit;
}

// Kiểm tra class_id từ tham số URL
$class_id = isset($_GET['class_id']) ? intval($_GET['class_id']) : 0;
if ($class_id <= 0) {
    Response::json(["error" => "Invalid class ID"], 400);
    exit;
}

// Kiểm tra xem sinh viên có đăng ký lớp học này hay không
$checkClassStmt = $conn->prepare("SELECT sc.id FROM student_classes sc 
                                 WHERE sc.student_id = ? AND sc.class_id = ?");
if (!$checkClassStmt) {
    Response::json(["error" => "Database error", "details" => $conn->error], 500);
    exit;
}

$checkClassStmt->bind_param("si", $student_id, $class_id);
$checkClassStmt->execute();
$checkResult = $checkClassStmt->get_result();

if ($checkResult->num_rows === 0) {
    Response::json(["error" => "Sinh viên không thuộc lớp học này hoặc lớp học không tồn tại"], 403);
    exit;
}
$checkClassStmt->close();

try {
    // Lấy thông tin lớp học
    $classQuery = "SELECT c.class_id, c.class_code, c.room, c.semester, 
                       cs.course_name, cs.course_code,
                       c.schedule_day, c.start_time, c.end_time, 
                       c.start_date, c.end_date,
                       t.full_name AS teacher_name
                FROM classes c
                JOIN courses cs ON c.course_id = cs.course_id
                JOIN teachers t ON c.teacher_id = t.teacher_id
                WHERE c.class_id = ?";
    
    $classStmt = $conn->prepare($classQuery);
    if (!$classStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    $classStmt->bind_param("i", $class_id);
    $classStmt->execute();
    $classResult = $classStmt->get_result();
    
    if ($classResult->num_rows === 0) {
        Response::json(["error" => "Lớp học không tồn tại"], 404);
        exit;
    }
    
    $classInfo = $classResult->fetch_assoc();
    $classStmt->close();
    
    // Lấy tổng quát thống kê điểm danh
    $statsQuery = "SELECT total_sessions, attended_sessions, last_updated 
                FROM attendance_statistics 
                WHERE student_id = ? AND class_id = ?";
    
    $statsStmt = $conn->prepare($statsQuery);
    if (!$statsStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    $statsStmt->bind_param("si", $student_id, $class_id);
    $statsStmt->execute();
    $statsResult = $statsStmt->get_result();
    
    $stats = [];
    if ($statsResult->num_rows > 0) {
        $stats = $statsResult->fetch_assoc();
        $stats['attendance_rate'] = ($stats['total_sessions'] > 0) 
            ? round(($stats['attended_sessions'] / $stats['total_sessions']) * 100, 1) 
            : 0;
    } else {
        $stats = [
            'total_sessions' => 0,
            'attended_sessions' => 0,
            'attendance_rate' => 0,
            'last_updated' => null
        ];
    }
    $statsStmt->close();
    
    // Lấy chi tiết điểm danh theo từng buổi học
    $attendanceQuery = "SELECT DATE(a.checkin_time) AS class_date,
                           a.checkin_time, a.verified, a.notes,
                           WEEK(a.checkin_time) AS week_number,
                           YEARWEEK(a.checkin_time) AS year_week
                       FROM attendance a
                       JOIN classes c ON a.course_id = c.course_id AND a.room = c.room
                       WHERE a.student_id = ? AND c.class_id = ?
                       ORDER BY a.checkin_time DESC";
    
    $attendanceStmt = $conn->prepare($attendanceQuery);
    if (!$attendanceStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    $attendanceStmt->bind_param("si", $student_id, $class_id);
    $attendanceStmt->execute();
    $attendanceResult = $attendanceStmt->get_result();
    
    $attendanceRecords = [];
    while ($record = $attendanceResult->fetch_assoc()) {
        // Xác định trạng thái điểm danh (đúng giờ, muộn, vắng)
        $checkInTime = new DateTime($record['checkin_time']);
        $classDate = $record['class_date'];
        $weekDay = strtolower(date('l', strtotime($classDate)));
        
        // Chỉ tính các ngày học trùng với lịch học của lớp
        if ($weekDay === $classInfo['schedule_day']) {
            $classStartTime = new DateTime($classDate . ' ' . $classInfo['start_time']);
            
            // Nếu điểm danh muộn 15 phút hoặc hơn, đánh dấu là late
            $lateThreshold = clone $classStartTime;
            $lateThreshold->add(new DateInterval('PT15M'));
            
            if ($checkInTime > $lateThreshold) {
                $record['status'] = 'late';
                $record['status_text'] = 'Đi trễ';
            } else {
                $record['status'] = 'present';
                $record['status_text'] = 'Có mặt';
            }
            
            $record['formatted_date'] = date('d/m/Y', strtotime($classDate));
            $record['formatted_time'] = date('H:i:s', strtotime($record['checkin_time']));
            
            // Tạo key cho tuần học
            $yearWeek = $record['year_week'];
            if (!isset($attendanceRecords[$yearWeek])) {
                $attendanceRecords[$yearWeek] = [
                    'week_number' => $record['week_number'],
                    'year_week' => $yearWeek,
                    'records' => []
                ];
            }
            
            $attendanceRecords[$yearWeek]['records'][] = $record;
        }
    }
    $attendanceStmt->close();
    
    // Tạo danh sách các buổi học theo lịch học của lớp
    $scheduledDates = [];
    $classStart = new DateTime($classInfo['start_date']);
    $classEnd = new DateTime($classInfo['end_date']);
    $interval = new DateInterval('P1D'); // 1 day interval
    $weekDay = $classInfo['schedule_day'];
    $dateFormat = 'Y-m-d';
    
    $current = clone $classStart;
    while ($current <= $classEnd) {
        if (strtolower(date('l', $current->getTimestamp())) === $weekDay) {
            $dateStr = $current->format($dateFormat);
            $yearWeek = date('YW', $current->getTimestamp());
            $week = date('W', $current->getTimestamp());
            
            if (!isset($scheduledDates[$yearWeek])) {
                $scheduledDates[$yearWeek] = [
                    'week_number' => $week,
                    'year_week' => $yearWeek,
                    'dates' => []
                ];
            }
            
            $scheduledDates[$yearWeek]['dates'][] = [
                'date' => $dateStr,
                'formatted_date' => date('d/m/Y', $current->getTimestamp()),
                'attendance' => null
            ];
        }
        $current->add($interval);
    }
    
    // Kết hợp dữ liệu điểm danh với lịch học
    foreach ($scheduledDates as $yearWeek => &$weekData) {
        foreach ($weekData['dates'] as &$dateData) {
            $found = false;
            
            if (isset($attendanceRecords[$yearWeek])) {
                foreach ($attendanceRecords[$yearWeek]['records'] as $record) {
                    if ($record['class_date'] === $dateData['date']) {
                        $dateData['attendance'] = $record;
                        $found = true;
                        break;
                    }
                }
            }
            
            if (!$found) {
                // Ngày học đã qua mà không có điểm danh -> vắng
                $classDate = new DateTime($dateData['date']);
                $today = new DateTime();
                if ($classDate < $today) {
                    $dateData['attendance'] = [
                        'status' => 'absent',
                        'status_text' => 'Vắng',
                        'class_date' => $dateData['date'],
                        'formatted_date' => $dateData['formatted_date']
                    ];
                }
                // Ngày học trong tương lai -> chưa học
                else {
                    $dateData['attendance'] = [
                        'status' => 'upcoming',
                        'status_text' => 'Chưa học',
                        'class_date' => $dateData['date'],
                        'formatted_date' => $dateData['formatted_date']
                    ];
                }
            }
        }
    }
    
    // Đảm bảo thứ tự tuần từ cao đến thấp (mới nhất lên đầu)
    krsort($scheduledDates);
    
    // Chuyển đổi associative array thành indexed array
    $attendanceSummary = array_values($scheduledDates);
    
    // Chuyển đổi ngày trong tuần từ tiếng Anh sang tiếng Việt
    $weekdays = [
        'monday' => 'Thứ Hai',
        'tuesday' => 'Thứ Ba',
        'wednesday' => 'Thứ Tư',
        'thursday' => 'Thứ Năm',
        'friday' => 'Thứ Sáu',
        'saturday' => 'Thứ Bảy',
        'sunday' => 'Chủ Nhật'
    ];
    $classInfo['schedule_day_vi'] = $weekdays[$classInfo['schedule_day']] ?? $classInfo['schedule_day'];
    $classInfo['formatted_time'] = date('H:i', strtotime($classInfo['start_time'])) . ' - ' . 
                                   date('H:i', strtotime($classInfo['end_time']));
    
    // Trả về kết quả
    Response::json([
        "success" => true,
        "class" => $classInfo,
        "statistics" => $stats,
        "attendance" => $attendanceSummary
    ]);

} catch (Exception $e) {
    Response::json(["error" => "Database error", "details" => $e->getMessage()], 500);
} finally {
    if (isset($classStmt) && $classStmt) $classStmt->close();
    if (isset($statsStmt) && $statsStmt) $statsStmt->close();
    if (isset($attendanceStmt) && $attendanceStmt) $attendanceStmt->close();
}
?>