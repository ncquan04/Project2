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

try {    // Lấy thông tin lớp học
    $classQuery = "SELECT c.class_id, c.class_code, c.room, c.semester, 
                       cs.course_name, cs.course_code, c.course_id,
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
    $statsStmt->close();    // Lấy chi tiết điểm danh theo từng buổi học - chỉ theo thời gian
    $attendanceQuery = "SELECT DATE(a.checkin_time) AS class_date,
                           a.checkin_time, a.verified, a.notes,
                           WEEK(a.checkin_time) AS week_number,
                           YEARWEEK(a.checkin_time) AS year_week
                       FROM attendance a
                       WHERE a.student_id = ?
                       ORDER BY a.checkin_time DESC";
    
    $attendanceStmt = $conn->prepare($attendanceQuery);
    if (!$attendanceStmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }
    $attendanceStmt->bind_param("s", $student_id);
    $attendanceStmt->execute();
    $attendanceResult = $attendanceStmt->get_result();      $attendanceRecords = [];
    $debugInfo = [
        'total_records' => 0,
        'all_attendance_records' => []
    ];
    
    while ($record = $attendanceResult->fetch_assoc()) {
        $debugInfo['total_records']++;
        $classDate = $record['class_date'];
        
        $debugInfo['all_attendance_records'][] = [
            'class_date' => $classDate,
            'checkin_time' => $record['checkin_time']
        ];
        
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
      // Kết hợp dữ liệu điểm danh với lịch học và tính toán trạng thái cho từng buổi học
    $today = new DateTime();
    $today->setTime(0, 0, 0); // Reset thời gian về đầu ngày để so sánh chính xác
      foreach ($scheduledDates as $yearWeek => &$weekData) {
        $validDates = [];
        foreach ($weekData['dates'] as &$dateData) {
            $classDate = new DateTime($dateData['date']);
            $classDateTime = new DateTime($dateData['date'] . ' ' . $classInfo['start_time']);
            $classEndTime = new DateTime($dateData['date'] . ' ' . $classInfo['end_time']);
            
            // Chỉ xử lý buổi học đã qua hoặc hôm nay
            if ($classDate <= $today) {
                // Tính thời gian chấp nhận điểm danh cho buổi học này
                // Chấp nhận từ 30 phút trước giờ học đến 15 phút sau giờ bắt đầu
                $acceptanceStart = clone $classDateTime;
                $acceptanceStart->sub(new DateInterval('PT30M')); // 30 phút trước
                
                $acceptanceEnd = clone $classDateTime;
                $acceptanceEnd->add(new DateInterval('PT15M')); // 15 phút sau giờ bắt đầu
                
                // Thêm thông tin thời gian chấp nhận vào dateData
                $dateData['acceptance_start'] = $acceptanceStart->format('H:i:s');
                $dateData['acceptance_end'] = $acceptanceEnd->format('H:i:s');
                $dateData['class_start_time'] = $classInfo['start_time'];
                $dateData['class_end_time'] = $classInfo['end_time'];
                  $found = false;
                
                // Tìm bản ghi điểm danh cho ngày này - kiểm tra tất cả attendance records
                foreach ($attendanceRecords as $weekRecords) {
                    foreach ($weekRecords['records'] as $record) {
                        if ($record['class_date'] === $dateData['date']) {
                            $checkInTime = new DateTime($record['checkin_time']);
                              // Tính toán trạng thái dựa trên thời gian chấp nhận của buổi học này
                            if ($checkInTime >= $acceptanceStart && $checkInTime <= $acceptanceEnd) {
                                // Điểm danh trong thời gian chấp nhận
                                if ($checkInTime <= $classDateTime) {
                                    $record['status'] = 'present';
                                    $record['status_text'] = 'Đi học';
                                } else {
                                    // Điểm danh sau giờ bắt đầu nhưng vẫn trong thời gian chấp nhận
                                    $record['status'] = 'late';
                                    $record['status_text'] = 'Muộn';
                                }
                                $record['is_valid_checkin'] = true;
                            } else {
                                // Điểm danh ngoài thời gian chấp nhận -> coi như vắng
                                $record['status'] = 'absent';
                                $record['status_text'] = 'Vắng';
                                $record['is_valid_checkin'] = false;
                            }
                            
                            $dateData['attendance'] = $record;
                            $found = true;
                            break 2; // Break cả 2 vòng lặp
                        }
                    }
                }
                  if (!$found) {
                    // Buổi học đã qua hoặc hôm nay mà không có điểm danh -> vắng
                    $now = new DateTime();
                    if ($classDate == $today && $now <= $acceptanceEnd) {
                        // Buổi học hôm nay và vẫn trong thời gian chấp nhận -> vẫn có thể coi là vắng nếu chưa điểm danh
                        $dateData['attendance'] = [
                            'status' => 'absent',
                            'status_text' => 'Vắng',
                            'class_date' => $dateData['date'],
                            'formatted_date' => $dateData['formatted_date'],
                            'is_valid_checkin' => true
                        ];
                    } else {
                        $dateData['attendance'] = [
                            'status' => 'absent',
                            'status_text' => 'Vắng',
                            'class_date' => $dateData['date'],
                            'formatted_date' => $dateData['formatted_date'],
                            'is_valid_checkin' => false
                        ];
                    }
                }
                
                $validDates[] = $dateData;
            }
            // Bỏ qua các buổi học trong tương lai
        }
        $weekData['dates'] = $validDates;
    }
    
    // Lọc bỏ các tuần không có buổi học nào (do skip các buổi học tương lai)
    foreach ($scheduledDates as $yearWeek => $weekData) {
        if (empty($weekData['dates'])) {
            unset($scheduledDates[$yearWeek]);
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
                                   date('H:i', strtotime($classInfo['end_time']));      // Trả về kết quả
    Response::json([
        "success" => true,
        "class" => $classInfo,
        "statistics" => $stats,
        "attendance" => $attendanceSummary,
        "debug" => $debugInfo,        "attendance_rules" => [
            "acceptance_window_before" => 30, // phút trước giờ học
            "acceptance_window_after" => 15,  // phút sau giờ bắt đầu
            "late_threshold" => 0, // điểm danh sau giờ bắt đầu = muộn
            "status_types" => [
                "present" => "Đi học",
                "late" => "Muộn", 
                "absent" => "Vắng"
            ]
        ]
    ]);

} catch (Exception $e) {
    Response::json(["error" => "Database error", "details" => $e->getMessage()], 500);
} finally {
    if (isset($classStmt) && $classStmt) $classStmt->close();
    if (isset($statsStmt) && $statsStmt) $statsStmt->close();
    if (isset($attendanceStmt) && $attendanceStmt) $attendanceStmt->close();
}
?>