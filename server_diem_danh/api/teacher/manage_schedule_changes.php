<?php
// api/teacher/manage_schedule_changes.php
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

// Kiểm tra kết nối cơ sở dữ liệu
if (!$conn) {
    Response::json(["success" => false, "error" => "Database connection failed"], 500);
    exit;
}

// Kiểm tra xem bảng schedule_changes đã tồn tại chưa
$tableExistsQuery = "SHOW TABLES LIKE 'class_schedule_changes'";
$tableExistsResult = $conn->query($tableExistsQuery);
$tableExists = ($tableExistsResult->num_rows > 0);

if (!$tableExists) {
    // Tạo bảng class_schedule_changes nếu chưa tồn tại
    $createTableQuery = "
        CREATE TABLE class_schedule_changes (
            schedule_change_id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            original_date DATE NOT NULL,
            new_date DATE NULL,
            status ENUM('cancelled', 'rescheduled', 'room_change') NOT NULL,
            original_room VARCHAR(10) NULL,
            new_room VARCHAR(10) NULL,
            reason TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            notification_sent BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    if (!$conn->query($createTableQuery)) {
        Response::json([
            "success" => false,
            "error" => "Không thể tạo bảng class_schedule_changes: " . $conn->error
        ], 500);
        exit;
    }
}

// Xác định loại request
$method = $_SERVER['REQUEST_METHOD'];

try {
    // GET - Lấy danh sách các thay đổi lịch học của một lớp học
    if ($method === 'GET') {
        $class_id = isset($_GET['class_id']) ? intval($_GET['class_id']) : 0;

        if ($class_id <= 0) {
            Response::json(["success" => false, "error" => "Invalid class ID"], 400);
            exit;
        }

        // Kiểm tra quyền truy cập lớp học
        $checkClassStmt = $conn->prepare("SELECT cl.class_id, cl.class_code, c.course_name, c.course_code, 
                                          cl.semester, cl.schedule_day, cl.start_time, cl.end_time, cl.room,
                                          cl.start_date, cl.end_date 
                                        FROM classes cl
                                        JOIN courses c ON cl.course_id = c.course_id
                                        WHERE cl.class_id = ? AND cl.teacher_id = ?");
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
        
        // Truy vấn danh sách thay đổi lịch học
        $query = "SELECT schedule_change_id, class_id, original_date, new_date, status,
                         original_room, new_room, reason, created_at, updated_at, notification_sent
                  FROM class_schedule_changes
                  WHERE class_id = ?
                  ORDER BY created_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $class_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $scheduleChanges = [];
        while ($row = $result->fetch_assoc()) {
            $scheduleChanges[] = $row;
        }
        
        Response::json([
            "success" => true, 
            "class" => $classInfo,
            "schedule_changes" => $scheduleChanges,
            "count" => count($scheduleChanges)
        ], 200);
    }
    
    // POST - Tạo thay đổi lịch học mới
    else if ($method === 'POST') {
        // Lấy và kiểm tra dữ liệu đầu vào
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['class_id']) || !isset($data['original_date']) || 
            !isset($data['status']) || $data['status'] === 'rescheduled' && !isset($data['new_date'])) {
            Response::json([
                "success" => false, 
                "error" => "Thiếu thông tin bắt buộc: class_id, original_date, status, hoặc new_date (khi rescheduled)"
            ], 400);
            exit;
        }
        
        $class_id = intval($data['class_id']);
        $original_date = $data['original_date'];
        $status = $data['status']; // 'cancelled', 'rescheduled', 'room_change'
        $new_date = $data['new_date'] ?? null;
        $original_room = $data['original_room'] ?? null;
        $new_room = $data['new_room'] ?? null;
        $reason = $data['reason'] ?? '';
        
        // Kiểm tra định dạng ngày
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $original_date) || 
            ($new_date !== null && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $new_date))) {
            Response::json([
                "success" => false, 
                "error" => "Định dạng ngày không hợp lệ. Phải có dạng YYYY-MM-DD"
            ], 400);
            exit;
        }
        
        // Kiểm tra trạng thái hợp lệ
        $validStatuses = ['cancelled', 'rescheduled', 'room_change'];
        if (!in_array($status, $validStatuses)) {
            Response::json([
                "success" => false, 
                "error" => "Trạng thái không hợp lệ. Phải là một trong: cancelled, rescheduled, room_change"
            ], 400);
            exit;
        }
        
        // Kiểm tra quyền truy cập lớp học
        $checkClassStmt = $conn->prepare("SELECT class_id FROM classes WHERE class_id = ? AND teacher_id = ?");
        $checkClassStmt->bind_param("is", $class_id, $teacher_id);
        $checkClassStmt->execute();
        $checkResult = $checkClassStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            Response::json([
                "success" => false, 
                "error" => "Không có quyền truy cập vào lớp học này hoặc lớp học không tồn tại"
            ], 403);
            exit;
        }
        
        // Thêm thay đổi lịch học mới
        $query = "INSERT INTO class_schedule_changes (
                    class_id, original_date, new_date, status,
                    original_room, new_room, reason, created_at, updated_at, notification_sent
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), 0)";
        
        $stmt = $conn->prepare($query);
        $stmt->bind_param("issssssi", $class_id, $original_date, $new_date, $status, 
                           $original_room, $new_room, $reason);
        $result = $stmt->execute();
        
        if ($result) {
            $schedule_change_id = $conn->insert_id;
            
            // Đọc lại dữ liệu từ DB
            $readStmt = $conn->prepare("SELECT * FROM class_schedule_changes WHERE schedule_change_id = ?");
            $readStmt->bind_param("i", $schedule_change_id);
            $readStmt->execute();
            $scheduleChange = $readStmt->get_result()->fetch_assoc();
            
            Response::json([
                "success" => true, 
                "message" => "Tạo thay đổi lịch học thành công",
                "schedule_change" => $scheduleChange
            ], 201);
        } else {
            throw new Exception("Không thể tạo thay đổi lịch học: " . $stmt->error);
        }
    }
    
    // PUT - Cập nhật thay đổi lịch học
    else if ($method === 'PUT') {
        // Lấy và kiểm tra dữ liệu đầu vào
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['schedule_change_id'])) {
            Response::json([
                "success" => false, 
                "error" => "Thiếu ID thay đổi lịch học"
            ], 400);
            exit;
        }
        
        $schedule_change_id = intval($data['schedule_change_id']);
        $status = $data['status'] ?? null;
        $new_date = $data['new_date'] ?? null;
        $original_room = $data['original_room'] ?? null;
        $new_room = $data['new_room'] ?? null;
        $reason = $data['reason'] ?? null;
        $notification_sent = $data['notification_sent'] ?? null;
        
        // Kiểm tra và cập nhật thay đổi lịch học
        $checkStmt = $conn->prepare(
            "SELECT sc.schedule_change_id, sc.class_id 
             FROM class_schedule_changes sc
             JOIN classes c ON sc.class_id = c.class_id
             WHERE sc.schedule_change_id = ? AND c.teacher_id = ?"
        );
        $checkStmt->bind_param("is", $schedule_change_id, $teacher_id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            Response::json([
                "success" => false, 
                "error" => "Không có quyền cập nhật thay đổi lịch học này hoặc thay đổi không tồn tại"
            ], 403);
            exit;
        }
        
        $scheduleChangeInfo = $checkResult->fetch_assoc();
        $class_id = $scheduleChangeInfo['class_id'];
        
        // Xây dựng câu truy vấn cập nhật
        $updateFields = [];
        $updateParams = [];
        $updateTypes = "";
        
        if ($status !== null) {
            $updateFields[] = "status = ?";
            $updateParams[] = $status;
            $updateTypes .= "s";
        }
        
        if ($new_date !== null) {
            $updateFields[] = "new_date = ?";
            $updateParams[] = $new_date;
            $updateTypes .= "s";
        }
        
        if ($original_room !== null) {
            $updateFields[] = "original_room = ?";
            $updateParams[] = $original_room;
            $updateTypes .= "s";
        }
        
        if ($new_room !== null) {
            $updateFields[] = "new_room = ?";
            $updateParams[] = $new_room;
            $updateTypes .= "s";
        }
        
        if ($reason !== null) {
            $updateFields[] = "reason = ?";
            $updateParams[] = $reason;
            $updateTypes .= "s";
        }
        
        if ($notification_sent !== null) {
            $updateFields[] = "notification_sent = ?";
            $updateParams[] = $notification_sent ? 1 : 0;
            $updateTypes .= "i";
        }
        
        // Thêm updated_at
        $updateFields[] = "updated_at = NOW()";
        
        if (empty($updateFields)) {
            Response::json([
                "success" => false, 
                "error" => "Không có dữ liệu nào được cung cấp để cập nhật"
            ], 400);
            exit;
        }
        
        // Thực hiện cập nhật
        $updateQuery = "UPDATE class_schedule_changes SET " . implode(", ", $updateFields) . 
                       " WHERE schedule_change_id = ?";
        
        $updateStmt = $conn->prepare($updateQuery);
        $updateParams[] = $schedule_change_id;
        $updateTypes .= "i";
        
        $updateStmt->bind_param($updateTypes, ...$updateParams);
        $result = $updateStmt->execute();
        
        if ($result) {
            // Đọc lại dữ liệu từ DB
            $readStmt = $conn->prepare("SELECT * FROM class_schedule_changes WHERE schedule_change_id = ?");
            $readStmt->bind_param("i", $schedule_change_id);
            $readStmt->execute();
            $scheduleChange = $readStmt->get_result()->fetch_assoc();
            
            Response::json([
                "success" => true, 
                "message" => "Cập nhật thay đổi lịch học thành công",
                "schedule_change" => $scheduleChange
            ], 200);
        } else {
            throw new Exception("Không thể cập nhật thay đổi lịch học: " . $updateStmt->error);
        }
    }
    
    // DELETE - Xóa thay đổi lịch học
    else if ($method === 'DELETE') {
        $schedule_change_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        
        if ($schedule_change_id <= 0) {
            Response::json(["success" => false, "error" => "Invalid schedule change ID"], 400);
            exit;
        }
        
        // Kiểm tra quyền truy cập
        $checkStmt = $conn->prepare(
            "SELECT sc.schedule_change_id 
             FROM class_schedule_changes sc
             JOIN classes c ON sc.class_id = c.class_id
             WHERE sc.schedule_change_id = ? AND c.teacher_id = ?"
        );
        $checkStmt->bind_param("is", $schedule_change_id, $teacher_id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            Response::json([
                "success" => false, 
                "error" => "Không có quyền xóa thay đổi lịch học này hoặc thay đổi không tồn tại"
            ], 403);
            exit;
        }
        
        // Xóa thay đổi lịch học
        $deleteStmt = $conn->prepare("DELETE FROM class_schedule_changes WHERE schedule_change_id = ?");
        $deleteStmt->bind_param("i", $schedule_change_id);
        $result = $deleteStmt->execute();
        
        if ($result) {
            Response::json([
                "success" => true, 
                "message" => "Đã xóa thay đổi lịch học"
            ], 200);
        } else {
            throw new Exception("Không thể xóa thay đổi lịch học: " . $deleteStmt->error);
        }
    }
    
    else {
        Response::json([
            "success" => false, 
            "error" => "Phương thức HTTP không được hỗ trợ"
        ], 405);
    }
} catch (Exception $e) {
    Response::json(["success" => false, "error" => "Lỗi server: " . $e->getMessage()], 500);
} finally {
    if (isset($checkClassStmt)) $checkClassStmt->close();
    if (isset($stmt)) $stmt->close();
    if (isset($checkStmt)) $checkStmt->close();
    if (isset($updateStmt)) $updateStmt->close();
    if (isset($readStmt)) $readStmt->close();
    if (isset($deleteStmt)) $deleteStmt->close();
}
