<?php
// api/student/studentAttendance.php
error_reporting(E_ERROR); // Turn off warnings to prevent HTML in JSON response
ini_set('display_errors', 0); // Don't display errors

require_once __DIR__ . '/../../config/config.php'; // Kết nối database
require_once __DIR__ . '/../../modules/Session.php';
require_once __DIR__ . '/../../modules/Response.php';
require_once __DIR__ . '/../../modules/CORS.php'; // Thêm module CORS

// Enable CORS
CORS::enableCORS();

// Khởi động session
Session::start();

// Kiểm tra quyền sinh viên hoặc phụ huynh - bỏ qua việc kiểm tra session cho môi trường phát triển
// Khi triển khai sản phẩm, bạn nên bỏ comment đoạn code bên dưới
/*
if (!isset($_SESSION['role']) || ($_SESSION['role'] !== 'student' && $_SESSION['role'] !== 'parent')) {
    Response::json(["error" => "Unauthorized"], 403);
    exit;
}
*/

// Lấy student_id từ session hoặc tham số
$student_id = $_SESSION['student_id'] ?? $_GET['student_id'] ?? '';
if (empty($student_id)) {
    Response::json(["error" => "Invalid student_id"], 400);
    exit;
}

// Xử lý các action
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'rooms':
        // Sử dụng prepared statement thay vì $conn->query()
        $stmt = $conn->prepare("SELECT DISTINCT room FROM attendance WHERE student_id = ?");
        if (!$stmt) {
            Response::json(["error" => "Database error", "details" => $conn->error], 500);
            exit;
        }
        $stmt->bind_param("s", $student_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $rooms = $result->fetch_all(MYSQLI_ASSOC);        
        $rooms = array_column($rooms, 'room');
        Response::json(["success" => true, "student_id" => $student_id, "rooms" => $rooms]);
        $stmt->close();
        break;
      case 'get_attendance_history':
        try {
            // Query để lấy lịch sử điểm danh với logic xác định trạng thái dựa trên lớp học
            $query = "SELECT 
                        a.attendance_id as id,
                        DATE(a.checkin_time) as date,
                        TIME(a.checkin_time) as time,
                        a.checkin_time,
                        a.room,
                        a.notes,
                        a.status as original_status,
                        c.course_name as class_name,
                        c.course_code,
                        t.full_name as teacher_name,
                        cl.start_time,
                        cl.end_time,
                        cl.schedule_day
                      FROM attendance a
                      LEFT JOIN courses c ON a.course_id = c.course_id
                      LEFT JOIN classes cl ON a.course_id = cl.course_id AND a.room = cl.room
                      LEFT JOIN teachers t ON cl.teacher_id = t.teacher_id
                      WHERE a.student_id = ?
                      ORDER BY a.checkin_time DESC
                      LIMIT 50";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                Response::json(["error" => "Database error", "details" => $conn->error], 500);
                exit;
            }
            
            $stmt->bind_param("s", $student_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $records = [];
            while ($row = $result->fetch_assoc()) {
                $checkinTime = new DateTime($row['checkin_time']);
                $checkinDate = $row['date'];
                $checkinTimeOnly = $row['time'];
                
                // Xác định trạng thái điểm danh dựa trên logic mới
                $finalStatus = 'present'; // Mặc định
                $matchedClass = null;
                
                // Nếu không có thông tin lớp học từ attendance, tìm lớp học phù hợp
                if (empty($row['class_name']) || empty($row['start_time'])) {
                    // Lấy danh sách lớp học của sinh viên trong ngày điểm danh
                    $classQuery = "SELECT 
                                    c.course_name as class_name,
                                    c.course_code,
                                    t.full_name as teacher_name,
                                    cl.start_time,
                                    cl.end_time,
                                    cl.schedule_day,
                                    cl.room as class_room
                                   FROM student_classes sc
                                   JOIN classes cl ON sc.class_id = cl.class_id
                                   JOIN courses c ON cl.course_id = c.course_id
                                   JOIN teachers t ON cl.teacher_id = t.teacher_id
                                   WHERE sc.student_id = ?
                                   AND cl.schedule_day = ?
                                   AND ? BETWEEN cl.start_date AND cl.end_date";
                    
                    $dayOfWeek = strtolower(date('l', strtotime($checkinDate)));
                    
                    $classStmt = $conn->prepare($classQuery);
                    $classStmt->bind_param("sss", $student_id, $dayOfWeek, $checkinDate);
                    $classStmt->execute();
                    $classResult = $classStmt->get_result();
                      $bestMatch = null;
                    $minTimeDiff = 9999; // Khởi tạo với giá trị lớn
                    
                    while ($classRow = $classResult->fetch_assoc()) {
                        $classStartTime = new DateTime($checkinDate . ' ' . $classRow['start_time']);
                        $timeDiffMinutes = ($checkinTime->getTimestamp() - $classStartTime->getTimestamp()) / 60;
                        $absTimeDiff = abs($timeDiffMinutes);
                        
                        // Chọn lớp học có thời gian bắt đầu gần nhất (trong khoảng 60 phút trước hoặc 30 phút sau)
                        if (($timeDiffMinutes >= -60 && $timeDiffMinutes <= 30) && $absTimeDiff < $minTimeDiff) {
                            $minTimeDiff = $absTimeDiff;
                            $bestMatch = $classRow;
                            $bestMatch['time_diff'] = $timeDiffMinutes;
                        }
                    }
                    $classStmt->close();
                      if ($bestMatch) {
                        $matchedClass = $bestMatch;
                        $classStartTime = new DateTime($checkinDate . ' ' . $bestMatch['start_time']);
                        $timeDiffMinutes = $bestMatch['time_diff'];
                        
                        // Xác định trạng thái dựa trên thời gian điểm danh:
                        // - Có mặt: điểm danh trong vòng 60 phút trước giờ học
                        // - Đi muộn: điểm danh trong vòng 30 phút sau giờ học
                        if ($timeDiffMinutes <= 0) {
                            // Điểm danh trước giờ học
                            $finalStatus = 'present';
                        } elseif ($timeDiffMinutes <= 30) {
                            // Điểm danh sau giờ học nhưng trong vòng 30 phút
                            $finalStatus = 'late';
                        } else {
                            $finalStatus = 'unknown';
                        }
                    } else {
                        // Không tìm thấy lớp học phù hợp
                        $finalStatus = 'unknown';
                    }
                } else {
                    // Đã có thông tin lớp học từ attendance
                    $matchedClass = [
                        'class_name' => $row['class_name'],
                        'course_code' => $row['course_code'],
                        'teacher_name' => $row['teacher_name'],
                        'start_time' => $row['start_time']
                    ];
                      if ($row['start_time']) {
                        $classStartTime = new DateTime($checkinDate . ' ' . $row['start_time']);
                        $timeDiffMinutes = ($checkinTime->getTimestamp() - $classStartTime->getTimestamp()) / 60;
                        
                        // Xác định trạng thái dựa trên thời gian điểm danh:
                        // - Có mặt: điểm danh trong vòng 60 phút trước giờ học
                        // - Đi muộn: điểm danh trong vòng 30 phút sau giờ học
                        if ($timeDiffMinutes <= 0) {
                            // Điểm danh trước giờ học
                            $finalStatus = 'present';
                        } elseif ($timeDiffMinutes <= 30) {
                            // Điểm danh sau giờ học nhưng trong vòng 30 phút
                            $finalStatus = 'late';
                        } else {
                            $finalStatus = 'unknown';
                        }
                    }
                }
                
                // Xử lý dữ liệu null và format
                $records[] = [
                    "id" => (int)$row['id'],
                    "date" => $row['date'],
                    "time" => $checkinTimeOnly,
                    "class_name" => $matchedClass['class_name'] ?? 'Không xác định',
                    "course_code" => $matchedClass['course_code'] ?? 'N/A',
                    "teacher_name" => $matchedClass['teacher_name'] ?? 'Không xác định',
                    "status" => $finalStatus,
                    "original_status" => $row['original_status'],
                    "room" => $row['room'],
                    "notes" => $row['notes'],
                    "class_start_time" => $matchedClass['start_time'] ?? null,
                    "time_difference_minutes" => isset($matchedClass['time_diff']) ? round($matchedClass['time_diff']) : null
                ];
            }
            
            $stmt->close();
            Response::json(["success" => true, "student_id" => $student_id, "records" => $records]);
        } catch (Exception $e) {
            Response::json(["error" => "Error fetching attendance history", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        // Xử lý lấy lịch sử điểm danh (mặc định)
        $filters = json_decode(file_get_contents('php://input'), true) ?? [];
        $query = "SELECT attendance_id, student_id, checkin_time, room 
                  FROM attendance 
                  WHERE student_id = ?";
        $params = [$student_id];
        $types = "s";

        if (!empty($filters['date'])) {
            $query .= " AND DATE(checkin_time) = ?";
            $params[] = $filters['date'];
            $types .= "s";
        }
        if (!empty($filters['startTime']) && !empty($filters['endTime'])) {
            $startTime = strtotime($filters['startTime']);
            $endTime = strtotime($filters['endTime']);
            if ($startTime === false || $endTime === false || $startTime >= $endTime) {
                Response::json(["error" => "Khoảng thời gian không hợp lệ"], 400);
                exit;
            }
            $query .= " AND TIME(checkin_time) BETWEEN ? AND ?";
            $params[] = $filters['startTime'];
            $params[] = $filters['endTime'];
            $types .= "ss";
        }
        if (!empty($filters['room'])) {
            $query .= " AND room = ?";
            $params[] = $filters['room'];
            $types .= "s";
        }

        $stmt = $conn->prepare($query);
        if (!$stmt) {
            Response::json(["error" => "Database error", "details" => $conn->error], 500);
            exit;
        }
        $stmt->bind_param($types, ...$params);
        $stmt->execute();        $result = $stmt->get_result();
        $attendance = $result->fetch_all(MYSQLI_ASSOC);

        Response::json(["success" => true, "student_id" => $student_id, "attendance" => $attendance]);
        $stmt->close();
        break;
}
?>