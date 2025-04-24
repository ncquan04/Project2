-- Tạo cơ sở dữ liệu
CREATE DATABASE attendance_system;
USE attendance_system;

-- Bảng sinh viên
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    rfid_uid VARCHAR(50) UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    class VARCHAR(20),
    email VARCHAR(100),
    phone VARCHAR(15),
    address VARCHAR(255),
    parent_name VARCHAR(100),
    parent_phone VARCHAR(15),
    parent_cccd VARCHAR(12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng giáo viên
CREATE TABLE teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    position VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(15),
    address VARCHAR(255),
    employee_id VARCHAR(20) UNIQUE,
    specialization VARCHAR(100),
    join_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng người dùng (admin, giáo viên, sinh viên, phụ huynh)
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'teacher', 'student', 'parent') NOT NULL,
    student_id VARCHAR(20) NULL,
    teacher_id INT NULL,
    email VARCHAR(100),
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

-- Bảng môn học
CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credits INT DEFAULT 3 NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng lớp học (thông tin lớp học của môn học)
CREATE TABLE classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    teacher_id INT NOT NULL,
    class_code VARCHAR(20) UNIQUE NOT NULL,
    room VARCHAR(10) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    schedule_day ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id) ON DELETE CASCADE
);

-- Bảng đăng ký học phần (liên kết sinh viên với các lớp học)
CREATE TABLE student_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    class_id INT NOT NULL,
    enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    UNIQUE KEY (student_id, class_id)
);

-- Bảng điểm danh
CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    rfid_uid VARCHAR(50) NOT NULL,
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    room VARCHAR(10) NOT NULL,
    course_id INT NULL,
    verified BOOLEAN DEFAULT FALSE, -- Xác nhận điểm danh bởi giáo viên
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL
);

-- Bảng thông báo
CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Thống kê điểm danh
CREATE TABLE attendance_statistics (
    statistic_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    class_id INT NOT NULL,
    total_sessions INT DEFAULT 0,
    attended_sessions INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(class_id) ON DELETE CASCADE,
    UNIQUE KEY (student_id, class_id)
);

-- Bảng trung gian để xử lý dữ liệu điểm danh đang chờ kết nối với khóa học
-- Giải pháp cho vấn đề không thể update cùng bảng trong trigger
CREATE TABLE attendance_course_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attendance_id INT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attendance_id) REFERENCES attendance(attendance_id) ON DELETE CASCADE
);

-- Stored procedure để tự động kết nối thông tin điểm danh với khóa học tương ứng
DELIMITER //

-- Procedure xử lý kết nối điểm danh với khóa học
-- Procedure này sẽ được gọi từ bên ngoài trigger, không nằm trong trigger
CREATE PROCEDURE MatchAttendanceWithCourse(IN attendance_id_param INT)
BEGIN
    DECLARE v_checkin_time DATETIME;
    DECLARE v_room VARCHAR(10);
    DECLARE v_student_id VARCHAR(20);
    DECLARE v_course_id INT;
    DECLARE v_day_of_week VARCHAR(10);
    
    -- Lấy thông tin từ attendance
    SELECT checkin_time, room, student_id 
    INTO v_checkin_time, v_room, v_student_id 
    FROM attendance 
    WHERE attendance_id = attendance_id_param;
    
    -- Lấy tên thứ trong tuần từ ngày điểm danh
    SET v_day_of_week = LOWER(DAYNAME(v_checkin_time));
    
    -- Tìm khóa học phù hợp với thông tin điểm danh
    SELECT c.course_id INTO v_course_id
    FROM classes cl
    JOIN courses c ON cl.course_id = c.course_id
    JOIN student_classes sc ON cl.class_id = sc.class_id
    WHERE cl.room = v_room
      AND sc.student_id = v_student_id
      AND cl.schedule_day = v_day_of_week
      AND TIME(v_checkin_time) BETWEEN DATE_SUB(cl.start_time, INTERVAL 15 MINUTE) 
                                   AND DATE_ADD(cl.end_time, INTERVAL 15 MINUTE)
      AND DATE(v_checkin_time) BETWEEN cl.start_date AND cl.end_date
    LIMIT 1;
    
    -- Cập nhật course_id trong attendance
    IF v_course_id IS NOT NULL THEN
        UPDATE attendance SET course_id = v_course_id 
        WHERE attendance_id = attendance_id_param;
        
        -- Cập nhật bảng thống kê điểm danh
        UPDATE attendance_statistics AS stats
        JOIN classes cl ON stats.class_id = cl.class_id
        SET stats.attended_sessions = stats.attended_sessions + 1,
            stats.last_updated = NOW()
        WHERE stats.student_id = v_student_id
          AND cl.course_id = v_course_id
          AND cl.room = v_room;
    END IF;
END //

-- Thủ tục xử lý hàng đợi điểm danh để kết nối với khóa học
CREATE PROCEDURE ProcessAttendanceQueue()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE cur_attendance_id INT;
    DECLARE cur CURSOR FOR 
        SELECT attendance_id 
        FROM attendance_course_queue 
        WHERE processed = FALSE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO cur_attendance_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Gọi procedure để kết nối attendance với course
        CALL MatchAttendanceWithCourse(cur_attendance_id);
        
        -- Đánh dấu đã xử lý
        UPDATE attendance_course_queue 
        SET processed = TRUE 
        WHERE attendance_id = cur_attendance_id;
    END LOOP;
    
    CLOSE cur;
END //

-- Thủ tục lấy toàn bộ thông tin điểm danh của sinh viên với thông tin khóa học
CREATE PROCEDURE GetStudentAttendanceWithCourseInfo(IN student_id_param VARCHAR(20))
BEGIN
    SELECT 
        a.attendance_id,
        a.student_id,
        a.checkin_time,
        a.room,
        a.verified,
        c.course_id,
        c.course_code,
        c.course_name,
        cl.class_code,
        cl.schedule_day,
        cl.start_time,
        cl.end_time
    FROM attendance a
    LEFT JOIN courses c ON a.course_id = c.course_id
    LEFT JOIN classes cl ON cl.course_id = c.course_id AND cl.room = a.room
    WHERE a.student_id = student_id_param
    ORDER BY a.checkin_time DESC;
END //

-- Thủ tục lấy thống kê điểm danh của sinh viên theo học kỳ
CREATE PROCEDURE GetStudentAttendanceStats(IN student_id_param VARCHAR(20), IN semester_param VARCHAR(20))
BEGIN
    SELECT 
        c.course_code,
        c.course_name,
        cl.class_code,
        stats.total_sessions,
        stats.attended_sessions,
        ROUND((stats.attended_sessions / stats.total_sessions) * 100, 2) AS attendance_percentage
    FROM attendance_statistics stats
    JOIN classes cl ON stats.class_id = cl.class_id
    JOIN courses c ON cl.course_id = c.course_id
    WHERE stats.student_id = student_id_param
      AND cl.semester = semester_param;
END //

DELIMITER ;

-- Trigger tự động đưa điểm danh vào hàng đợi để xử lý sau
DELIMITER //

CREATE TRIGGER after_attendance_insert
AFTER INSERT ON attendance
FOR EACH ROW
BEGIN
    -- Thêm vào hàng đợi để xử lý sau
    INSERT INTO attendance_course_queue (attendance_id) VALUES (NEW.attendance_id);
END //

-- Trigger tự động tạo bản ghi thống kê khi sinh viên đăng ký lớp học
CREATE TRIGGER after_student_class_insert
AFTER INSERT ON student_classes
FOR EACH ROW
BEGIN
    -- Lấy tổng số buổi học của lớp (tạm tính dựa trên thời gian bắt đầu và kết thúc)
    DECLARE total_count INT;
    DECLARE class_start_date DATE;
    DECLARE class_end_date DATE;
    DECLARE class_day_of_week VARCHAR(10);
    
    SELECT start_date, end_date, schedule_day
    INTO class_start_date, class_end_date, class_day_of_week
    FROM classes WHERE class_id = NEW.class_id;
    
    -- Tính tổng số buổi học dựa trên ngày học trong tuần và khoảng thời gian khóa học
    SET total_count = (
        SELECT COUNT(*) 
        FROM (
            SELECT ADDDATE(class_start_date, INTERVAL n DAY) date_value
            FROM (
                SELECT a.N + b.N * 10 + c.N * 100 n
                FROM (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
                     (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
                     (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c
                ORDER BY n
            ) numbers
            WHERE ADDDATE(class_start_date, INTERVAL n DAY) <= class_end_date
        ) days
        WHERE DAYNAME(date_value) = UPPER(class_day_of_week)
    );
    
    -- Tạo bản ghi thống kê mới
    INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions)
    VALUES (NEW.student_id, NEW.class_id, total_count, 0);
END //

DELIMITER ;

-- Chỉ mục để tối ưu truy vấn
CREATE INDEX idx_attendance_student_time ON attendance(student_id, checkin_time);
CREATE INDEX idx_attendance_course_time ON attendance(course_id, checkin_time);
CREATE INDEX idx_classes_schedule ON classes(schedule_day, start_time, end_time);
CREATE INDEX idx_class_semester ON classes(semester);
CREATE INDEX idx_attendance_queue_processed ON attendance_course_queue(processed);
CREATE INDEX idx_teachers_name ON teachers(full_name);
CREATE INDEX idx_teachers_department ON teachers(department);
CREATE INDEX idx_teachers_status ON teachers(status);

-- Bảng quản lý thay đổi lịch học
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

-- Chỉ mục để tối ưu truy vấn thay đổi lịch học
CREATE INDEX idx_schedule_changes_class ON class_schedule_changes(class_id);
CREATE INDEX idx_schedule_changes_dates ON class_schedule_changes(original_date, new_date);