<?php
header('Content-Type: application/json');
include_once '../../config/config.php';

// Thiết lập header cho API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Nhận dữ liệu từ ESP32
$data = json_decode(file_get_contents('php://input'), true);
$rfid_uid = $data['rfid_uid'] ?? '';
$room = $data['room'] ?? '';

if (empty($rfid_uid) || empty($room)) {
    echo json_encode(['error' => 'Missing required data']);
    exit;
}

try {
    // Kiểm tra sinh viên tồn tại
    $stmt = $conn->prepare("SELECT student_id, full_name FROM students WHERE rfid_uid = ?");
    $stmt->bind_param("s", $rfid_uid);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(value: ['error' => 'Student not found']);
        exit;
    }
    
    $student = $result->fetch_assoc();
    $student_id = $student['student_id'];
    $full_name = $student['full_name'];
    
    // Lấy thời gian hiện tại
    $current_time = date('Y-m-d H:i:s');
    $current_day = strtolower(date('l')); // Lấy tên thứ trong tuần
    
    // Tìm lớp học phù hợp
    $stmt = $conn->prepare("
        SELECT c.class_id, c.start_time, c.end_time
        FROM classes c
        JOIN student_classes sc ON c.class_id = sc.class_id
        WHERE sc.student_id = ?
        AND c.room = ?
        AND c.schedule_day = ?
        AND DATE(?) BETWEEN c.start_date AND c.end_date
        AND TIME(?) BETWEEN TIME(c.start_time) AND TIME(c.end_time)
    ");
    
    $stmt->bind_param("sssss", $student_id, $room, $current_day, $current_time, $current_time);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $status = 'invalid';
    $notes = 'Không hợp lệ';
    $class_id = null;
    
    if ($result->num_rows > 0) {
        $class = $result->fetch_assoc();
        $class_id = $class['class_id'];
        
        // Lấy course_id từ class_id
        $stmt = $conn->prepare("SELECT course_id FROM classes WHERE class_id = ?");
        $stmt->bind_param("i", $class_id);
        $stmt->execute();
        $course_result = $stmt->get_result();
        $course = $course_result->fetch_assoc();
        $course_id = $course['course_id'];
        
        // Tính thời gian chênh lệch
        $checkin_time = new DateTime($current_time);
        $start_time = new DateTime(date('Y-m-d ') . $class['start_time']);
        $diff_minutes = ($checkin_time->getTimestamp() - $start_time->getTimestamp()) / 60;
        
        if ($diff_minutes <= 15) {
            $status = 'present';
            $notes = 'Đúng giờ';
        } else {
            $status = 'late';
            $notes = 'Đi trễ ' . round($diff_minutes) . ' phút';
        }
    }
    
    // Ghi dữ liệu điểm danh
    $stmt = $conn->prepare("
        INSERT INTO attendance (
            student_id, 
            rfid_uid, 
            checkin_time,
            room, 
            course_id,
            verified,
            status, 
            notes
        )
        VALUES (?, ?, ?, ?, ?, TRUE, ?, ?)
    ");
    
    $stmt->bind_param("ssssiss", 
        $student_id, 
        $rfid_uid, 
        $current_time,
        $room, 
        $course_id,
        $status, 
        $notes
    );
    $stmt->execute();
    
    // Trả về kết quả
    echo json_encode([
        'full_name' => $full_name,
        'student_id' => $student_id,
        'status' => $status
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?> 
