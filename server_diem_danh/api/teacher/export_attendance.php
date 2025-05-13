<?php
// api/teacher/export_attendance.php
require_once __DIR__ . '/../../modules/Session.php';

require_once __DIR__ . '/../../modules/CORS.php';
require_once __DIR__ . '/../../config/config.php';

// Khởi động session
// K�ch ho?t CORS
CORS::enableCORS();

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
$week_number = isset($_GET['week']) ? intval($_GET['week']) : null;
$export_format = isset($_GET['format']) ? $_GET['format'] : 'xlsx';

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
    $checkClassStmt = $conn->prepare(
        "SELECT cl.class_id, cl.class_code, c.course_name, c.course_code, cl.semester, 
               cl.schedule_day, cl.start_time, cl.end_time, cl.room,
               cl.start_date, cl.end_date
        FROM classes cl
        JOIN courses c ON cl.course_id = c.course_id
        WHERE cl.class_id = ? AND cl.teacher_id = ?"
    );
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
    
    // Lấy danh sách tuần học của lớp bằng YEARWEEK
    $weekQuery = "SELECT DISTINCT YEARWEEK(a.checkin_time) as week_number 
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
    
    if (empty($weeks)) {
        Response::json([
            "success" => false,
            "error" => "Chưa có dữ liệu điểm danh cho lớp này"
        ], 404);
        exit;
    }
    
    // Chọn tuần cụ thể hoặc tất cả các tuần
    $weekCondition = '';
    $weekParams = [$class_id];
    $weekTypes = 'i';
    
    if ($week_number !== null) {
        if (!in_array($week_number, $weeks)) {
            Response::json([
                "success" => false,
                "error" => "Không tìm thấy dữ liệu điểm danh cho tuần $week_number"
            ], 404);
            exit;
        }
        $weekCondition = ' AND YEARWEEK(a.checkin_time) = ?';
        $weekParams[] = $week_number;
        $weekTypes .= 'i';
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
    
    // Lấy tất cả các ngày học và dữ liệu điểm danh
    $attendanceQuery = "SELECT a.student_id, DATE(a.checkin_time) as class_date, 
                              a.checkin_time, a.verified, a.notes,
                              YEARWEEK(a.checkin_time) as week_number,
                              cl.start_time, cl.end_time
                       FROM attendance a
                       JOIN classes cl ON cl.course_id = a.course_id
                       WHERE cl.class_id = ? $weekCondition
                       ORDER BY a.checkin_time ASC, a.student_id ASC";
    
    $attendanceStmt = $conn->prepare($attendanceQuery);
    $attendanceStmt->bind_param($weekTypes, ...$weekParams);
    $attendanceStmt->execute();
    $attendanceResult = $attendanceStmt->get_result();
    
    // Sắp xếp dữ liệu điểm danh theo tuần và ngày
    $attendanceData = [];
    $classDates = [];
    
    while ($attendance = $attendanceResult->fetch_assoc()) {
        $date = $attendance['class_date'];
        $studentId = $attendance['student_id'];
        $week = $attendance['week_number'];
        
        $dateKey = "W{$week}_{$date}";
        
        if (!isset($classDates[$dateKey])) {
            $classDates[$dateKey] = [
                'date' => $date,
                'week' => $week,
                'display' => "Tuần {$week} - " . date('d/m/Y', strtotime($date))
            ];
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
        
        $attendanceData[$studentId][$dateKey] = [
            'status' => $status,
            'check_in_time' => $attendance['checkin_time'],
            'verified' => $attendance['verified'],
            'notes' => $attendance['notes']
        ];
    }
    
    // Sắp xếp ngày học theo tuần và ngày
    uasort($classDates, function($a, $b) {
        if ($a['week'] != $b['week']) {
            return $a['week'] - $b['week'];
        }
        return strcmp($a['date'], $b['date']);
    });
    
    // Tạo dữ liệu Excel
    $excelData = [];
    
    // Thêm tiêu đề
    $header = ['STT', 'MSSV', 'Họ và tên', 'Lớp'];
    foreach ($classDates as $dateKey => $dateInfo) {
        $header[] = $dateInfo['display'];
    }
    $header[] = 'Có mặt';
    $header[] = 'Vắng';
    $header[] = 'Đi muộn';
    $header[] = 'Tỷ lệ đi học (%)';
    
    $excelData[] = $header;
    
    // Thêm dữ liệu sinh viên
    $index = 1;
    foreach ($students as $student) {
        $studentId = $student['student_id'];
        $row = [
            $index++,
            $studentId,
            $student['full_name'],
            $student['student_class']
        ];
        
        $present = 0;
        $absent = 0;
        $late = 0;
        
        foreach ($classDates as $dateKey => $dateInfo) {
            $status = $attendanceData[$studentId][$dateKey]['status'] ?? 'absent';
            
            if ($status === 'present') {
                $row[] = 'Có mặt';
                $present++;
            } elseif ($status === 'late') {
                $row[] = 'Muộn';
                $late++;
            } elseif ($status === 'absent') {
                $row[] = 'Vắng';
                $absent++;
            } else {
                $row[] = '';
            }
        }
        
        $totalClasses = count($classDates);
        $attendanceRate = $totalClasses > 0 ? round((($present + $late) / $totalClasses) * 100, 2) : 0;
        
        $row[] = $present;
        $row[] = $absent;
        $row[] = $late;
        $row[] = $attendanceRate;
        
        $excelData[] = $row;
    }
    
    // Tạo tên file dựa trên thông tin lớp
    $className = preg_replace('/[^a-zA-Z0-9_]/', '_', $classInfo['class_code']);
    $semester = preg_replace('/[^a-zA-Z0-9_]/', '_', $classInfo['semester']);
    $weekSuffix = $week_number ? "_Week{$week_number}" : "";
    $filename = "Attendance_{$className}_{$semester}{$weekSuffix}_" . date('Ymd_His');
    
    // Tạo header cho HTTP response để download file Excel
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment;filename="' . $filename . '.xlsx"');
    header('Cache-Control: max-age=0');
    
    // Tạo file Excel và gửi nó tới client
    // Lưu ý: Cần cài thêm thư viện PHPSpreadsheet để tạo file Excel
    // Đây chỉ là mã giả để minh họa cấu trúc, bạn cần thêm mã để tạo file Excel thực tế
    
    /*
    // Ví dụ với PHPSpreadsheet
    require 'vendor/autoload.php';
    
    use PhpOffice\PhpSpreadsheet\Spreadsheet;
    use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
    
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    
    // Thêm dữ liệu vào bảng tính
    foreach ($excelData as $rowIndex => $row) {
        foreach ($row as $colIndex => $value) {
            $sheet->setCellValueByColumnAndRow($colIndex + 1, $rowIndex + 1, $value);
        }
    }
    
    // Định dạng bảng tính
    $sheet->getStyle('A1:' . $sheet->getHighestColumn() . '1')->getFont()->setBold(true);
    
    $writer = new Xlsx($spreadsheet);
    $writer->save('php://output');
    */
    
    // Trả về dữ liệu JSON tạm thời cho mục đích phát triển
    Response::json([
        "success" => true,
        "message" => "API xuất Excel đang được phát triển",
        "class" => $classInfo,
        "week" => $week_number ? $week_number : "all",
        "students_count" => count($students),
        "dates_count" => count($classDates),
        "data_sample" => array_slice($excelData, 0, 3) // Chỉ trả về mẫu 3 hàng đầu tiên
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
