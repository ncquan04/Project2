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
$class_id = isset($_GET['class_id']) ? intval($_GET['class_id']) : (isset($_GET['classId']) ? intval($_GET['classId']) : 0);
$week_number = isset($_GET['week']) ? intval($_GET['week']) : null;
$export_format = isset($_GET['format']) ? strtolower($_GET['format']) : 'excel';

// Xác nhận format hợp lệ
if (!in_array($export_format, ['excel', 'csv', 'pdf'])) {
    $export_format = 'excel'; // Mặc định là excel nếu định dạng không hợp lệ
}

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
    
    // Tạo dữ liệu file theo định dạng yêu cầu
    if ($export_format === 'csv') {
        // Xuất CSV
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment;filename="' . $filename . '.csv"');
        header('Cache-Control: max-age=0');
        
        $output = fopen('php://output', 'w');
        
        // Thêm BOM (Byte Order Mark) cho Excel đọc được UTF-8
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // Ghi dữ liệu vào file CSV
        foreach ($excelData as $row) {
            fputcsv($output, $row);
        }
        
        fclose($output);
        exit;
    } 
    elseif ($export_format === 'excel') {
        // Kiểm tra nếu thư viện PHPSpreadsheet đã được cài đặt
        if (file_exists(__DIR__ . '/../../phpdotenv_lib/vendor/autoload.php')) {
            require_once __DIR__ . '/../../phpdotenv_lib/vendor/autoload.php';
            
            try {
                // Sử dụng PHPSpreadsheet để tạo file Excel
                $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
                $sheet = $spreadsheet->getActiveSheet();
                $sheet->setTitle('Danh sách điểm danh');
                
                // Thêm dữ liệu vào bảng tính
                foreach ($excelData as $rowIndex => $row) {
                    foreach ($row as $colIndex => $value) {
                        $sheet->setCellValueByColumnAndRow($colIndex + 1, $rowIndex + 1, $value);
                    }
                }
                
                // Định dạng bảng tính
                $headerRow = 'A1:' . \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($header) - 1) . '1';
                $sheet->getStyle($headerRow)->getFont()->setBold(true);
                $sheet->getStyle($headerRow)->getFill()->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setARGB('FFCCCCCC');
                
                // Đặt độ rộng cột
                foreach (range('A', $sheet->getHighestColumn()) as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
                
                // Tạo writer cho Excel
                $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
                
                // Thiết lập header HTTP
                header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                header('Content-Disposition: attachment;filename="' . $filename . '.xlsx"');
                header('Cache-Control: max-age=0');
                
                // Gửi file tới client
                $writer->save('php://output');
                exit;
            } catch (\Exception $e) {
                // Nếu có lỗi, ghi log lỗi và trả về dữ liệu JSON
                error_log('PHPSpreadsheet error: ' . $e->getMessage());
                
                // Trả về dữ liệu JSON mà không có hỗ trợ Excel thực tế
                header('Content-Type: application/json');
                echo json_encode([
                    "success" => false,
                    "error" => "Không thể tạo file Excel: " . $e->getMessage(),
                    "note" => "Thư viện PHPSpreadsheet cần được cài đặt"
                ]);
                exit;
            }
        } else {
            // Thư viện PHPSpreadsheet chưa được cài đặt
            // Trả về dữ liệu CSV như là phương án dự phòng
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment;filename="' . $filename . '.csv"');
            header('Cache-Control: max-age=0');
            
            $output = fopen('php://output', 'w');
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM
            
            foreach ($excelData as $row) {
                fputcsv($output, $row);
            }
            
            fclose($output);
            exit;
        }
    }
    elseif ($export_format === 'pdf') {
        // Kiểm tra nếu thư viện TCPDF/FPDF/mPDF đã được cài đặt
        if (file_exists(__DIR__ . '/../../phpdotenv_lib/vendor/autoload.php')) {
            require_once __DIR__ . '/../../phpdotenv_lib/vendor/autoload.php';
            
            try {
                // Giả sử chúng ta sử dụng mPDF
                if (class_exists('\\Mpdf\\Mpdf')) {
                    $mpdf = new \Mpdf\Mpdf([
                        'margin_left' => 10,
                        'margin_right' => 10,
                        'margin_top' => 15,
                        'margin_bottom' => 15,
                    ]);
                    
                    // Thiết lập thông tin trang
                    $mpdf->SetTitle("Danh sách điểm danh {$classInfo['class_code']}");
                    $mpdf->SetCreator('Em Yêu Trường Em');
                    
                    // Tạo nội dung HTML
                    $html = "<h1 style='text-align: center;'>Danh sách điểm danh lớp {$classInfo['class_code']}</h1>";
                    $html .= "<p>Môn học: {$classInfo['course_name']}</p>";
                    $html .= "<p>Phòng: {$classInfo['room']}</p>";
                    
                    // Bắt đầu bảng
                    $html .= "<table border='1' cellpadding='5' style='width: 100%; border-collapse: collapse;'>";
                    
                    // Thêm header
                    $html .= "<tr style='background-color: #CCCCCC;'>";
                    foreach ($header as $cell) {
                        $html .= "<th>{$cell}</th>";
                    }
                    $html .= "</tr>";
                    
                    // Thêm dữ liệu
                    for ($i = 1; $i < count($excelData); $i++) {
                        $html .= "<tr>";
                        foreach ($excelData[$i] as $cell) {
                            $html .= "<td>{$cell}</td>";
                        }
                        $html .= "</tr>";
                    }
                    
                    $html .= "</table>";
                    
                    // Thêm trang vào PDF
                    $mpdf->WriteHTML($html);
                    
                    // Thiết lập header HTTP
                    header('Content-Type: application/pdf');
                    header('Content-Disposition: attachment;filename="' . $filename . '.pdf"');
                    
                    // Gửi file tới client
                    $mpdf->Output($filename . '.pdf', 'D');
                    exit;
                } else {
                    throw new Exception("Thư viện PDF không được tìm thấy");
                }
            } catch (\Exception $e) {
                // Nếu có lỗi, ghi log lỗi và trả về dữ liệu JSON
                error_log('PDF generation error: ' . $e->getMessage());
                
                // Trả về dữ liệu JSON mà không có hỗ trợ PDF thực tế
                header('Content-Type: application/json');
                echo json_encode([
                    "success" => false,
                    "error" => "Không thể tạo file PDF: " . $e->getMessage(),
                    "note" => "Cần cài đặt thư viện PDF như TCPDF, FPDF hoặc mPDF"
                ]);
                exit;
            }
        } else {
            // Thư viện PDF chưa được cài đặt
            // Trả về dữ liệu CSV như là phương án dự phòng
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment;filename="' . $filename . '.csv"');
            header('Cache-Control: max-age=0');
            
            $output = fopen('php://output', 'w');
            fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF)); // BOM
            
            foreach ($excelData as $row) {
                fputcsv($output, $row);
            }
            
            fclose($output);
            exit;
        }
    }
    
    // Nếu không thỏa các điều kiện trên, trả về dữ liệu JSON
    Response::json([
        "success" => true,
        "message" => "API xuất dữ liệu đang được phát triển",
        "format_requested" => $export_format,
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
