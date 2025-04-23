-- File: sample_data.sql
-- Dữ liệu mẫu cho hệ thống điểm danh sinh viên
-- Lưu ý: Chạy sau khi đã tạo cấu trúc database từ file schema.sql

USE attendance_system;

-- Thêm dữ liệu mẫu cho bảng sinh viên (students)
INSERT INTO students (student_id, rfid_uid, full_name, class, email, phone, address, parent_name, parent_phone, parent_cccd, created_at) 
VALUES 
('SV001', 'RFID001', 'Nguyễn Văn An', '20CNTT1', 'an.nguyenvan@example.com', '0901234561', 'Quận 1, TP HCM', 'Nguyễn Văn Cha', '0912345671', '079123456781', NOW()),
('SV002', 'RFID002', 'Trần Thị Bình', '20CNTT1', 'binh.tranthi@example.com', '0901234562', 'Quận 2, TP HCM', 'Trần Văn Cha', '0912345672', '079123456782', NOW()),
('SV003', 'RFID003', 'Lê Văn Cường', '20CNTT2', 'cuong.levan@example.com', '0901234563', 'Quận 3, TP HCM', 'Lê Văn Cha', '0912345673', '079123456783', NOW()),
('SV004', 'RFID004', 'Phạm Thị Dung', '20CNTT2', 'dung.phamthi@example.com', '0901234564', 'Quận 4, TP HCM', 'Phạm Văn Cha', '0912345674', '079123456784', NOW()),
('SV005', 'RFID005', 'Hoàng Văn Em', '20CNTT3', 'em.hoangvan@example.com', '0901234565', 'Quận 5, TP HCM', 'Hoàng Văn Cha', '0912345675', '079123456785', NOW());

-- Tài khoản cho sinh viên (users)
INSERT INTO users (username, password, role, student_id, email, created_at) 
VALUES 
('sv001', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV001', 'an.nguyenvan@example.com', NOW()),
('sv002', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV002', 'binh.tranthi@example.com', NOW()),
('sv003', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV003', 'cuong.levan@example.com', NOW()),
('sv004', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV004', 'dung.phamthi@example.com', NOW()),
('sv005', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV005', 'em.hoangvan@example.com', NOW());

-- Thêm tài khoản giáo viên (users)
INSERT INTO users (username, password, role, email, created_at) 
VALUES 
('teacher1', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'manager', 'teacher1@example.com', NOW()),
('teacher2', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'manager', 'teacher2@example.com', NOW());

-- Lưu ý: Mật khẩu mẫu là "admin123" đã được mã hóa

-- Thêm dữ liệu mẫu cho bảng môn học (courses)
INSERT INTO courses (course_code, course_name, credits, description, created_at) 
VALUES 
('CSC101', 'Nhập môn lập trình', 3, 'Giới thiệu về các khái niệm lập trình cơ bản', NOW()),
('CSC201', 'Cấu trúc dữ liệu và giải thuật', 4, 'Học về các cấu trúc dữ liệu và giải thuật', NOW()),
('CSC301', 'Cơ sở dữ liệu', 3, 'Nguyên lý cơ sở dữ liệu, SQL và quản trị CSDL', NOW()),
('CSC401', 'Phát triển ứng dụng Web', 3, 'Học phát triển ứng dụng web với HTML, CSS, JS', NOW()),
('CSC501', 'Trí tuệ nhân tạo', 4, 'Giới thiệu về AI và ứng dụng', NOW());

-- Thêm dữ liệu mẫu cho bảng lớp học (classes)
INSERT INTO classes (course_id, teacher_id, class_code, room, semester, schedule_day, start_time, end_time, start_date, end_date, created_at) 
VALUES 
(1, 6, 'CSC101.01', 'P101', '2025-1', 'monday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(2, 6, 'CSC201.01', 'P201', '2025-1', 'tuesday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(3, 7, 'CSC301.01', 'P301', '2025-1', 'wednesday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(4, 7, 'CSC401.01', 'P401', '2025-1', 'thursday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(5, 6, 'CSC501.01', 'P501', '2025-1', 'friday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW());

-- Thêm dữ liệu mẫu cho bảng đăng ký học phần (student_classes)
INSERT INTO student_classes (student_id, class_id, enrolled_date) 
VALUES 
('SV001', 1, NOW()),
('SV001', 3, NOW()),
('SV001', 5, NOW()),
('SV002', 1, NOW()),
('SV002', 2, NOW()),
('SV002', 4, NOW()),
('SV003', 2, NOW()),
('SV003', 3, NOW()),
('SV003', 5, NOW()),
('SV004', 1, NOW()),
('SV004', 4, NOW()),
('SV005', 2, NOW()),
('SV005', 5, NOW());

-- Thêm dữ liệu mẫu cho bảng điểm danh (attendance)
-- Không được trực tiếp đặt trường course_id vì nó sẽ được tự động điền bởi trigger và procedure
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified) 
VALUES 
('SV001', 'RFID001', '2025-04-14 07:45:00', 'P101', TRUE),
('SV001', 'RFID001', '2025-04-16 07:40:00', 'P301', TRUE),
('SV001', 'RFID001', '2025-04-18 07:35:00', 'P501', TRUE),
('SV002', 'RFID002', '2025-04-14 07:50:00', 'P101', TRUE),
('SV002', 'RFID002', '2025-04-15 13:05:00', 'P201', TRUE),
('SV003', 'RFID003', '2025-04-15 13:10:00', 'P201', FALSE),
('SV003', 'RFID003', '2025-04-16 07:55:00', 'P301', FALSE),
('SV004', 'RFID004', '2025-04-14 08:00:00', 'P101', TRUE),
('SV004', 'RFID004', '2025-04-17 13:15:00', 'P401', FALSE),
('SV005', 'RFID005', '2025-04-15 13:20:00', 'P201', TRUE),
('SV005', 'RFID005', '2025-04-18 08:05:00', 'P501', TRUE);

-- Thêm một số thông báo mẫu (notifications)
INSERT INTO notifications (user_id, title, message, is_read, created_at) 
VALUES 
(1, 'Chào mừng đến với hệ thống', 'Chào mừng bạn đến với hệ thống điểm danh sinh viên.', FALSE, NOW()),
(2, 'Chào mừng đến với hệ thống', 'Chào mừng bạn đến với hệ thống điểm danh sinh viên.', TRUE, NOW()),
(3, 'Nhắc nhở về điểm danh', 'Bạn đã vắng mặt buổi học ngày 12/04/2025.', FALSE, NOW());

-- Cập nhật thống kê điểm danh
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated) 
VALUES 
('SV001', 1, 15, 1, NOW()),
('SV001', 3, 15, 1, NOW()),
('SV001', 5, 15, 1, NOW()),
('SV002', 1, 15, 1, NOW()),
('SV002', 2, 15, 1, NOW()),
('SV002', 4, 15, 0, NOW()),
('SV003', 2, 15, 1, NOW()),
('SV003', 3, 15, 1, NOW()),
('SV003', 5, 15, 0, NOW()),
('SV004', 1, 15, 1, NOW()),
('SV004', 4, 15, 1, NOW()),
('SV005', 2, 15, 1, NOW()),
('SV005', 5, 15, 1, NOW());

-- Xử lý hàng đợi điểm danh để kết nối với khóa học
-- Gọi procedure này sau khi thêm dữ liệu mẫu cho attendance để cập nhật course_id
CALL ProcessAttendanceQueue();

-- Xác nhận hoàn thành
SELECT 'Sample data has been successfully imported' AS message;