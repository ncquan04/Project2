<?php
// Bật hiển thị lỗi chi tiết (chỉ nên dùng khi debug)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once '../../config/config.php';

function removeVietnameseTones($str) {
    $str = preg_replace([
        "/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/",
        "/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/",
        "/(ì|í|ị|ỉ|ĩ)/",
        "/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/",
        "/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/",
        "/(ỳ|ý|ỵ|ỷ|ỹ)/",
        "/(đ)/",
        "/(À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ)/",
        "/(È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ)/",
        "/(Ì|Í|Ị|Ỉ|Ĩ)/",
        "/(Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ)/",
        "/(Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ)/",
        "/(Ỳ|Ý|Ỵ|Ỷ|Ỹ)/",
        "/(Đ)/"
    ], [
        "a", "e", "i", "o", "u", "y", "d",
        "A", "E", "I", "O", "U", "Y", "D"
    ], $str);
    return $str;
}

// Nhận dữ liệu từ ESP32
$data = null;
$raw_input = '';
$json_error = 0;
$json_error_msg = 'No error';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw_input = file_get_contents('php://input');
    
    // Làm sạch JSON - loại bỏ dấu phẩy thừa trước dấu }
    $cleaned_input = preg_replace('/,\s*}/', '}', $raw_input);
    $cleaned_input = preg_replace('/,\s*]/', ']', $cleaned_input);
    
    $data = json_decode($cleaned_input, true);
    $json_error = json_last_error();
    $json_error_msg = json_last_error_msg();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Xử lý GET parameters
    $data = $_GET;
    $raw_input = json_encode($_GET);
}

$rfid_uid = $data['rfid_uid'] ?? '';
$room = $data['room'] ?? '';

if (empty($rfid_uid) || empty($room)) {
    echo json_encode([
        'error' => 'Missing required data',
        'raw_input' => $raw_input,
        'cleaned_input' => $cleaned_input ?? 'N/A (GET request)',
        'raw_input_length' => strlen($raw_input),
        'received_data' => $data,
        'json_error' => $json_error,
        'json_error_msg' => $json_error_msg,
        'rfid_uid' => $rfid_uid,
        'room' => $room,
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'not set'
    ]);
    exit;
}

try {
    // Kiểm tra sinh viên tồn tại
    $stmt = $conn->prepare("SELECT student_id, full_name FROM students WHERE rfid_uid = ?");
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    if (!$stmt->bind_param("s", $rfid_uid)) {
        echo json_encode(['error' => 'Bind param failed: ' . $stmt->error]);
        exit;
    }
    if (!$stmt->execute()) {
        echo json_encode(['error' => 'Execute failed: ' . $stmt->error]);
        exit;
    }
    $result = $stmt->get_result();
    if (!$result) {
        echo json_encode(['error' => 'Get result failed: ' . $stmt->error]);
        exit;
    }
    
    if ($result->num_rows === 0) {
        echo json_encode(['error' => 'Student not found']);
        exit;
    }
    
    $student = $result->fetch_assoc();
    $student_id = $student['student_id'];
    $full_name = $student['full_name'];
    $full_name_no_tone = removeVietnameseTones($full_name);
    
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
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed (class): ' . $conn->error]);
        exit;
    }
    if (!$stmt->bind_param("sssss", $student_id, $room, $current_day, $current_time, $current_time)) {
        echo json_encode(['error' => 'Bind param failed (class): ' . $stmt->error]);
        exit;
    }
    if (!$stmt->execute()) {
        echo json_encode(['error' => 'Execute failed (class): ' . $stmt->error]);
        exit;
    }
    $result = $stmt->get_result();
    if (!$result) {
        echo json_encode(['error' => 'Get result failed (class): ' . $stmt->error]);
        exit;
    }
    
    $status = 'present';
    $notes = 'Không hợp lệ';
    $class_id = null;
    
    if ($result->num_rows > 0) {
        $class = $result->fetch_assoc();
        $class_id = $class['class_id'];
        
        // Lấy course_id từ class_id
        $stmt = $conn->prepare("SELECT course_id FROM classes WHERE class_id = ?");
        if (!$stmt) {
            echo json_encode(['error' => 'Prepare failed (course): ' . $conn->error]);
            exit;
        }
        if (!$stmt->bind_param("i", $class_id)) {
            echo json_encode(['error' => 'Bind param failed (course): ' . $stmt->error]);
            exit;
        }
        if (!$stmt->execute()) {
            echo json_encode(['error' => 'Execute failed (course): ' . $stmt->error]);
            exit;
        }
        $course_result = $stmt->get_result();
        if (!$course_result) {
            echo json_encode(['error' => 'Get result failed (course): ' . $stmt->error]);
            exit;
        }
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
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed (attendance): ' . $conn->error]);
        exit;
    }
    if (!$stmt->bind_param("ssssiss", 
        $student_id, 
        $rfid_uid, 
        $current_time,
        $room, 
        $course_id,
        $status, 
        $notes
    )) {
        echo json_encode(['error' => 'Bind param failed (attendance): ' . $stmt->error]);
        exit;
    }
    if (!$stmt->execute()) {
        echo json_encode(['error' => 'Execute failed (attendance): ' . $stmt->error]);
        exit;
    }
    
    // Trả về kết quả
    echo json_encode([
        'full_name' => $full_name_no_tone,
        'student_id' => $student_id,
        'status' => $status
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => 'Server error: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}
?>
