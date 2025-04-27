<?php
// api/student/studentClasses.php
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

// Xử lý các action
$action = $_GET['action'] ?? 'classes';

switch ($action) {
    case 'classes':
    case 'get_classes':
    case 'get_all_classes':
        // Lấy danh sách lớp học mà sinh viên đang tham gia kèm lịch học
        try {
            // Truy vấn tất cả các lớp học của sinh viên
            $query = "SELECT c.class_id, c.class_code, c.room, c.semester, 
                            cs.course_name, cs.course_code, cs.credits,
                            c.schedule_day, c.start_time, c.end_time, 
                            c.start_date, c.end_date,
                            t.full_name AS teacher_name
                     FROM student_classes sc
                     JOIN classes c ON sc.class_id = c.class_id
                     JOIN courses cs ON c.course_id = cs.course_id
                     JOIN teachers t ON c.teacher_id = t.teacher_id
                     WHERE sc.student_id = ?
                     ORDER BY c.semester DESC, c.schedule_day";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare statement failed: " . $conn->error);
            }
            $stmt->bind_param("s", $student_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
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
            
            $classes = [];
            while ($row = $result->fetch_assoc()) {
                // Chuyển đổi tên ngày
                $row['schedule_day_vi'] = $weekdays[$row['schedule_day']] ?? $row['schedule_day'];
                
                // Định dạng thời gian
                $row['formatted_time'] = date('H:i', strtotime($row['start_time'])) . 
                                        ' - ' . 
                                        date('H:i', strtotime($row['end_time']));
                
                $row['is_active'] = strtotime($row['end_date']) >= time();
                
                $classes[] = $row;
            }
            
            Response::json(["success" => true, "classes" => $classes]);
            $stmt->close();
        } catch (Exception $e) {
            Response::json(["error" => "Database error", "details" => $e->getMessage()], 500);
        }
        break;

    case 'active':
    case 'get_active_classes':
        // Lấy danh sách lớp học đang hoạt động (học kỳ hiện tại)
        try {
            $query = "SELECT c.class_id, c.class_code, c.room, c.semester, 
                            cs.course_name, cs.course_code, cs.credits,
                            c.schedule_day, c.start_time, c.end_time, 
                            c.start_date, c.end_date,
                            t.full_name AS teacher_name
                     FROM student_classes sc
                     JOIN classes c ON sc.class_id = c.class_id
                     JOIN courses cs ON c.course_id = cs.course_id
                     JOIN teachers t ON c.teacher_id = t.teacher_id
                     WHERE sc.student_id = ?
                     AND c.end_date >= CURDATE()
                     ORDER BY c.schedule_day, c.start_time";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare statement failed: " . $conn->error);
            }
            $stmt->bind_param("s", $student_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
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
            
            $classes = [];
            while ($row = $result->fetch_assoc()) {
                // Chuyển đổi tên ngày
                $row['schedule_day_vi'] = $weekdays[$row['schedule_day']] ?? $row['schedule_day'];
                
                // Định dạng thời gian
                $row['formatted_time'] = date('H:i', strtotime($row['start_time'])) . 
                                        ' - ' . 
                                        date('H:i', strtotime($row['end_time']));
                
                $row['is_active'] = true; // These are active classes
                
                $classes[] = $row;
            }
            
            Response::json(["success" => true, "classes" => $classes]);
            $stmt->close();
        } catch (Exception $e) {
            Response::json(["error" => "Database error", "details" => $e->getMessage()], 500);
        }
        break;

    case 'get_class_details':
        // Lấy chi tiết một lớp học cụ thể
        $class_id = $_GET['class_id'] ?? '';
        if (empty($class_id)) {
            Response::json(["error" => "Thiếu class_id"], 400);
            exit;
        }
        
        try {
            $query = "SELECT c.class_id, c.class_code, c.room, c.semester, 
                            cs.course_name, cs.course_code, cs.credits,
                            c.schedule_day, c.start_time, c.end_time, 
                            c.start_date, c.end_date,
                            t.full_name AS teacher_name
                     FROM classes c
                     JOIN student_classes sc ON c.class_id = sc.class_id
                     JOIN courses cs ON c.course_id = cs.course_id
                     JOIN teachers t ON c.teacher_id = t.teacher_id
                     WHERE sc.student_id = ? AND c.class_id = ?";
            
            $stmt = $conn->prepare($query);
            if (!$stmt) {
                throw new Exception("Prepare statement failed: " . $conn->error);
            }
            $stmt->bind_param("si", $student_id, $class_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows === 0) {
                Response::json(["error" => "Không tìm thấy lớp học"], 404);
                exit;
            }
            
            $class = $result->fetch_assoc();
            
            // Chuyển đổi ngày trong tuần
            $weekdays = [
                'monday' => 'Thứ Hai',
                'tuesday' => 'Thứ Ba',
                'wednesday' => 'Thứ Tư',
                'thursday' => 'Thứ Năm',
                'friday' => 'Thứ Sáu',
                'saturday' => 'Thứ Bảy',
                'sunday' => 'Chủ Nhật'
            ];
            
            // Chuyển đổi tên ngày
            $class['schedule_day_vi'] = $weekdays[$class['schedule_day']] ?? $class['schedule_day'];
            
            // Định dạng thời gian
            $class['formatted_time'] = date('H:i', strtotime($class['start_time'])) . 
                                      ' - ' . 
                                      date('H:i', strtotime($class['end_time']));
            
            $class['is_active'] = strtotime($class['end_date']) >= time();
            
            Response::json(["success" => true, "class" => $class]);
            $stmt->close();
        } catch (Exception $e) {
            Response::json(["error" => "Database error", "details" => $e->getMessage()], 500);
        }
        break;

    default:
        Response::json(["error" => "Invalid action: " . $action], 400);
        break;
}
?>