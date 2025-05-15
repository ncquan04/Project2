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
('SV005', 'RFID005', 'Hoàng Văn Em', '20CNTT3', 'em.hoangvan@example.com', '0901234565', 'Quận 5, TP HCM', 'Hoàng Văn Cha', '0912345675', '079123456785', NOW()),
('SV006', 'RFID006', 'Võ Thị Phương', '20CNTT1', 'phuong.vothi@example.com', '0901234566', 'Quận 6, TP HCM', 'Võ Văn Cha', '0912345676', '079123456786', NOW()),
('SV007', 'RFID007', 'Đặng Văn Quân', '20CNTT2', 'quan.dangvan@example.com', '0901234567', 'Quận 7, TP HCM', 'Đặng Văn Cha', '0912345677', '079123456787', NOW()),
('SV008', 'RFID008', 'Nguyễn Thị Sen', '20CNTT3', 'sen.nguyenthi@example.com', '0901234568', 'Quận 8, TP HCM', 'Nguyễn Văn Cha', '0912345678', '079123456788', NOW()),
('SV009', 'RFID009', 'Trần Văn Tâm', '20CNTT1', 'tam.tranvan@example.com', '0901234569', 'Quận 9, TP HCM', 'Trần Văn Cha', '0912345679', '079123456789', NOW()),
('SV010', 'RFID010', 'Lê Thị Uyên', '20CNTT2', 'uyen.lethi@example.com', '0901234570', 'Quận 10, TP HCM', 'Lê Văn Cha', '0912345680', '079123456790', NOW()),
('SV011', 'RFID011', 'Hoàng Văn Việt', '20CNTT3', 'viet.hoangvan@example.com', '0901234571', 'Quận 11, TP HCM', 'Hoàng Văn Cha', '0912345681', '079123456791', NOW()),
('SV012', 'RFID012', 'Trần Thị Xuân', '20CNTT1', 'xuan.tranthi@example.com', '0901234572', 'Quận 12, TP HCM', 'Trần Văn Cha', '0912345682', '079123456792', NOW()),
('SV013', 'RFID013', 'Nguyễn Văn Yên', '20CNTT2', 'yen.nguyenvan@example.com', '0901234573', 'Quận Bình Thạnh, TP HCM', 'Nguyễn Văn Cha', '0912345683', '079123456793', NOW()),
('SV014', 'RFID014', 'Lê Thị Zung', '20CNTT3', 'zung.lethi@example.com', '0901234574', 'Quận Tân Bình, TP HCM', 'Lê Văn Cha', '0912345684', '079123456794', NOW()),
('SV015', 'RFID015', 'Phạm Văn Anh', '20CNTT1', 'anh.phamvan@example.com', '0901234575', 'Quận Tân Phú, TP HCM', 'Phạm Văn Cha', '0912345685', '079123456795', NOW());

-- Tài khoản cho sinh viên (users)
INSERT INTO users (username, password, role, student_id, email, created_at) 
VALUES 
('sv001', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV001', 'an.nguyenvan@example.com', NOW()),
('sv002', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV002', 'binh.tranthi@example.com', NOW()),
('sv003', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV003', 'cuong.levan@example.com', NOW()),
('sv004', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV004', 'dung.phamthi@example.com', NOW()),
('sv005', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV005', 'em.hoangvan@example.com', NOW()),
('sv006', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV006', 'phuong.vothi@example.com', NOW()),
('sv007', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV007', 'quan.dangvan@example.com', NOW()),
('sv008', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV008', 'sen.nguyenthi@example.com', NOW()),
('sv009', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV009', 'tam.tranvan@example.com', NOW()),
('sv010', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV010', 'uyen.lethi@example.com', NOW()),
('sv011', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV011', 'viet.hoangvan@example.com', NOW()),
('sv012', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV012', 'xuan.tranthi@example.com', NOW()),
('sv013', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV013', 'yen.nguyenvan@example.com', NOW()),
('sv014', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV014', 'zung.lethi@example.com', NOW()),
('sv015', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV015', 'anh.phamvan@example.com', NOW());

-- Dữ liệu mẫu cho giáo viên
INSERT INTO teachers (full_name, department, position, email, phone, employee_id, specialization, join_date)
VALUES 
('Nguyễn Văn Anh', 'Công nghệ thông tin', 'Giảng viên', 'vananh@example.edu.vn', '0901234567', 'GV001', 'Lập trình', '2020-01-15'),
('Trần Thị Bình', 'Công nghệ thông tin', 'Giảng viên chính', 'thibinh@example.edu.vn', '0912345678', 'GV002', 'An toàn mạng', '2018-05-10'),
('Lê Văn Cường', 'Khoa học máy tính', 'Trưởng bộ môn', 'vancuong@example.edu.vn', '0923456789', 'GV003', 'Machine Learning', '2015-03-22'),
('Phạm Hương Giang', 'Công nghệ phần mềm', 'Giảng viên', 'huonggiang@example.edu.vn', '0934567890', 'GV004', 'Phát triển ứng dụng di động', '2019-07-05'),
('Trần Minh Hoàng', 'Hệ thống thông tin', 'Giảng viên chính', 'minhhoang@example.edu.vn', '0945678901', 'GV005', 'Phân tích dữ liệu', '2017-09-12'),
('Nguyễn Thanh Hà', 'Mạng máy tính', 'Giảng viên', 'thanhha@example.edu.vn', '0956789012', 'GV006', 'Mạng không dây và IoT', '2021-02-28'),
('Lê Quốc Khánh', 'Công nghệ đa phương tiện', 'Giảng viên chính', 'quockhanh@example.edu.vn', '0967890123', 'GV007', 'Xử lý ảnh và đồ họa máy tính', '2016-11-18');

-- Tạo tài khoản cho giáo viên
INSERT INTO users (username, password, role, teacher_id, email)
VALUES 
('vananh', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 1, 'vananh@example.edu.vn'),
('thibinh', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 2, 'thibinh@example.edu.vn'),
('vancuong', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 3, 'vancuong@example.edu.vn'),
('huonggiang', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 4, 'huonggiang@example.edu.vn'),
('minhhoang', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 5, 'minhhoang@example.edu.vn'),
('thanhha', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 6, 'thanhha@example.edu.vn'),
('quockhanh', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'teacher', 7, 'quockhanh@example.edu.vn');

-- Dữ liệu mẫu cho admin và manager
INSERT INTO users (username, password, role, email) 
VALUES 
('admin', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'admin', 'admin@example.com'),
('manager', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'manager', 'manager@example.com');

-- Lưu ý: Mật khẩu mẫu là "admin123" đã được mã hóa

-- Thêm dữ liệu mẫu cho bảng môn học (courses)
INSERT INTO courses (course_code, course_name, credits, description, created_at) 
VALUES 
('CSC101', 'Nhập môn lập trình', 3, 'Giới thiệu về các khái niệm lập trình cơ bản', NOW()),
('CSC201', 'Cấu trúc dữ liệu và giải thuật', 4, 'Học về các cấu trúc dữ liệu và giải thuật', NOW()),
('CSC301', 'Cơ sở dữ liệu', 3, 'Nguyên lý cơ sở dữ liệu, SQL và quản trị CSDL', NOW()),
('CSC401', 'Phát triển ứng dụng Web', 3, 'Học phát triển ứng dụng web với HTML, CSS, JS', NOW()),
('CSC501', 'Trí tuệ nhân tạo', 4, 'Giới thiệu về AI và ứng dụng', NOW()),
('CSC102', 'Kiến trúc máy tính', 3, 'Tìm hiểu về cấu trúc và hoạt động của máy tính', NOW()),
('CSC202', 'Lập trình hướng đối tượng', 4, 'Phương pháp lập trình OOP với Java', NOW()),
('CSC302', 'Mạng máy tính', 3, 'Kiến thức cơ bản về mạng và giao thức', NOW()),
('CSC402', 'Phát triển ứng dụng di động', 4, 'Phát triển app cho Android và iOS', NOW()),
('CSC502', 'Xử lý ngôn ngữ tự nhiên', 4, 'Kỹ thuật xử lý ngôn ngữ tự nhiên và ứng dụng', NOW());

-- Thêm dữ liệu mẫu cho bảng lớp học (classes)
INSERT INTO classes (course_id, teacher_id, class_code, room, semester, schedule_day, start_time, end_time, start_date, end_date, created_at) 
VALUES 
(1, 1, 'CSC101.01', 'P101', '2025-1', 'monday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(2, 1, 'CSC201.01', 'P201', '2025-1', 'tuesday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(3, 2, 'CSC301.01', 'P301', '2025-1', 'wednesday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(4, 2, 'CSC401.01', 'P401', '2025-1', 'thursday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(5, 3, 'CSC501.01', 'P501', '2025-1', 'friday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(6, 3, 'CSC102.01', 'P102', '2025-1', 'monday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(7, 4, 'CSC202.01', 'P202', '2025-1', 'tuesday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(8, 4, 'CSC302.01', 'P302', '2025-1', 'wednesday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(9, 5, 'CSC402.01', 'P402', '2025-1', 'thursday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(10, 5, 'CSC502.01', 'P502', '2025-1', 'friday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(1, 6, 'CSC101.02', 'P103', '2025-1', 'monday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(2, 6, 'CSC201.02', 'P203', '2025-1', 'tuesday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(3, 7, 'CSC301.02', 'P303', '2025-1', 'wednesday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW()),
(4, 7, 'CSC401.02', 'P403', '2025-1', 'thursday', '13:00:00', '16:00:00', '2025-02-15', '2025-05-30', NOW()),
(5, 1, 'CSC501.02', 'P503', '2025-1', 'friday', '07:30:00', '10:30:00', '2025-02-15', '2025-05-30', NOW());

-- Thêm dữ liệu mẫu cho bảng đăng ký học phần (student_classes)
INSERT INTO student_classes (student_id, class_id, enrolled_date) VALUES
-- Sinh viên SV001 đăng ký các lớp
('SV001', 1, '2025-01-15'),  -- CSC101.01
('SV001', 3, '2025-01-15'),  -- CSC301.01
('SV001', 5, '2025-01-16'),  -- CSC501.01

-- Sinh viên SV002 đăng ký các lớp
('SV002', 1, '2025-01-15'),  -- CSC101.01
('SV002', 3, '2025-01-15'),  -- CSC301.01
('SV002', 5, '2025-01-16'),  -- CSC501.01

-- Sinh viên SV003 đăng ký các lớp
('SV003', 2, '2025-01-15'),  -- CSC201.01
('SV003', 4, '2025-01-15'),  -- CSC401.01
('SV003', 6, '2025-01-16'),  -- CSC102.01

-- Sinh viên SV004 đăng ký các lớp
('SV004', 2, '2025-01-15'),  -- CSC201.01
('SV004', 4, '2025-01-15'),  -- CSC401.01
('SV004', 6, '2025-01-16'),  -- CSC102.01

-- Sinh viên SV005 đăng ký các lớp
('SV005', 7, '2025-01-15'),  -- CSC202.01
('SV005', 8, '2025-01-15'),  -- CSC302.01
('SV005', 9, '2025-01-16'),  -- CSC402.01

-- Sinh viên SV006 đăng ký các lớp
('SV006', 7, '2025-01-15'),  -- CSC202.01
('SV006', 8, '2025-01-15'),  -- CSC302.01
('SV006', 9, '2025-01-16'),  -- CSC402.01

-- Sinh viên SV007 đăng ký các lớp
('SV007', 11, '2025-01-17'),  -- CSC101.02
('SV007', 13, '2025-01-17'),  -- CSC301.02
('SV007', 15, '2025-01-17'),  -- CSC501.02

-- Sinh viên SV008 đăng ký các lớp
('SV008', 11, '2025-01-17'),  -- CSC101.02
('SV008', 13, '2025-01-17'),  -- CSC301.02
('SV008', 15, '2025-01-17'),  -- CSC501.02

-- Sinh viên SV009 đăng ký các lớp
('SV009', 12, '2025-01-17'),  -- CSC201.02
('SV009', 14, '2025-01-17'),  -- CSC401.02
('SV009', 10, '2025-01-17'),  -- CSC502.01

-- Sinh viên SV010 đăng ký các lớp
('SV010', 12, '2025-01-17'),  -- CSC201.02
('SV010', 14, '2025-01-17'),  -- CSC401.02
('SV010', 10, '2025-01-17');  -- CSC502.01

-- Thêm dữ liệu mẫu cho bảng điểm danh (attendance)
-- Lưu ý: Ngày và thời gian điểm danh sẽ phù hợp với lịch học của các lớp

-- Điểm danh cho lớp CSC101.01 (Thứ 2, phòng P101)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV001', 'RFID001', '2025-04-21 07:25:00', 'P101', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-21 07:28:00', 'P101', TRUE, 'Đúng giờ'),
('SV001', 'RFID001', '2025-04-14 07:35:00', 'P101', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-14 07:45:00', 'P101', TRUE, 'Đi trễ 15 phút'),
('SV001', 'RFID001', '2025-04-07 07:29:00', 'P101', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-07 07:31:00', 'P101', TRUE, 'Đúng giờ');

-- Điểm danh cho lớp CSC301.01 (Thứ 4, phòng P301)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV001', 'RFID001', '2025-04-23 07:25:00', 'P301', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-23 07:28:00', 'P301', TRUE, 'Đúng giờ'),
('SV001', 'RFID001', '2025-04-16 07:35:00', 'P301', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-16 07:45:00', 'P301', TRUE, 'Đi trễ 15 phút'),
('SV001', 'RFID001', '2025-04-09 07:29:00', 'P301', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-09 07:31:00', 'P301', TRUE, 'Đúng giờ');

-- Điểm danh cho lớp CSC201.01 (Thứ 3, phòng P201)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV003', 'RFID003', '2025-04-22 12:55:00', 'P201', TRUE, 'Đúng giờ'),
('SV004', 'RFID004', '2025-04-22 12:58:00', 'P201', TRUE, 'Đúng giờ'),
('SV003', 'RFID003', '2025-04-15 13:05:00', 'P201', TRUE, 'Đúng giờ'),
('SV004', 'RFID004', '2025-04-15 13:25:00', 'P201', TRUE, 'Đi trễ 25 phút'),
('SV003', 'RFID003', '2025-04-08 12:59:00', 'P201', TRUE, 'Đúng giờ'),
('SV004', 'RFID004', '2025-04-08 13:01:00', 'P201', TRUE, 'Đúng giờ');

-- Điểm danh cho lớp CSC101.02 (Thứ 2, phòng P103)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV007', 'RFID007', '2025-04-21 07:25:00', 'P103', TRUE, 'Đúng giờ'),
('SV008', 'RFID008', '2025-04-21 07:28:00', 'P103', TRUE, 'Đúng giờ'),
('SV007', 'RFID007', '2025-04-14 07:35:00', 'P103', TRUE, 'Đúng giờ'),
('SV008', 'RFID008', '2025-04-14 08:05:00', 'P103', TRUE, 'Đi trễ 35 phút'),
('SV007', 'RFID007', '2025-04-07 07:29:00', 'P103', TRUE, 'Đúng giờ'),
('SV008', 'RFID008', '2025-04-07 07:31:00', 'P103', TRUE, 'Đúng giờ');

-- Thông báo
INSERT INTO notifications (user_id, title, message, is_read, created_at)
VALUES
(1, 'Cập nhật hệ thống', 'Hệ thống sẽ bảo trì vào ngày 30/04/2025', FALSE, NOW()),
(1, 'Thông báo học phí', 'Vui lòng thanh toán học phí kỳ 2 trước ngày 15/05/2025', FALSE, NOW()),
(2, 'Cập nhật hệ thống', 'Hệ thống sẽ bảo trì vào ngày 30/04/2025', FALSE, NOW()),
(3, 'Lịch thi', 'Lịch thi học kỳ 2 đã được cập nhật', TRUE, NOW()),
(4, 'Thông báo nghỉ học', 'Lớp CSC401.01 sẽ nghỉ học vào ngày 01/05/2025', FALSE, NOW()),
(5, 'Thay đổi phòng học', 'Lớp CSC301.02 sẽ chuyển sang phòng P305 từ tuần sau', TRUE, NOW());

-- Thay đổi lịch học
INSERT INTO class_schedule_changes (class_id, original_date, new_date, status, original_room, new_room, reason, notification_sent)
VALUES
(1, '2025-05-05', '2025-05-12', 'rescheduled', 'P101', 'P101', 'Giảng viên bận công tác', TRUE),
(3, '2025-05-07', NULL, 'cancelled', 'P301', NULL, 'Giảng viên nghỉ ốm', TRUE),
(4, '2025-05-08', '2025-05-08', 'room_change', 'P401', 'P405', 'Phòng P401 đang sửa chữa', FALSE),
(7, '2025-05-06', '2025-05-13', 'rescheduled', 'P202', 'P202', 'Trùng với lịch hội thảo khoa', TRUE),
(9, '2025-05-01', NULL, 'cancelled', 'P402', NULL, 'Nghỉ lễ', TRUE);

-- Thêm dữ liệu cho bảng attendance_course_queue
-- Những dữ liệu điểm danh đã xử lý
INSERT INTO attendance_course_queue (attendance_id, processed, created_at)
VALUES
(1, TRUE, '2025-04-21 07:25:00'),
(2, TRUE, '2025-04-21 07:28:00'),
(3, TRUE, '2025-04-14 07:35:00'),
(4, TRUE, '2025-04-14 07:45:00'),
(5, TRUE, '2025-04-07 07:29:00'),
(6, TRUE, '2025-04-07 07:31:00'),
(7, TRUE, '2025-04-23 07:25:00'),
(8, TRUE, '2025-04-23 07:28:00'),
(9, TRUE, '2025-04-16 07:35:00'),
(10, TRUE, '2025-04-16 07:45:00'),
(11, TRUE, '2025-04-09 07:29:00'),
(12, TRUE, '2025-04-09 07:31:00'),
(13, TRUE, '2025-04-22 12:55:00'),
(14, TRUE, '2025-04-22 12:58:00'),
(15, TRUE, '2025-04-15 13:05:00'),
(16, TRUE, '2025-04-15 13:25:00'),
(17, TRUE, '2025-04-08 12:59:00'),
(18, TRUE, '2025-04-08 13:01:00'),
(19, TRUE, '2025-04-21 07:25:00'),
(20, TRUE, '2025-04-21 07:28:00'),
(21, TRUE, '2025-04-14 07:35:00'),
(22, TRUE, '2025-04-14 08:05:00'),
(23, TRUE, '2025-04-07 07:29:00'),
(24, TRUE, '2025-04-07 07:31:00');

-- Thêm dữ liệu cho bảng thống kê điểm danh
-- Lớp CSC101.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV001', 1, 15, 14, NOW()),
('SV002', 1, 15, 12, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC301.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV001', 3, 15, 15, NOW()),
('SV002', 3, 15, 11, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC501.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV001', 5, 15, 14, NOW()),
('SV002', 5, 15, 13, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC201.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV003', 2, 15, 15, NOW()),
('SV004', 2, 15, 12, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC401.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV003', 4, 15, 13, NOW()),
('SV004', 4, 15, 11, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC102.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV003', 6, 15, 15, NOW()),
('SV004', 6, 15, 14, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC202.01
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV005', 7, 15, 13, NOW()),
('SV006', 7, 15, 12, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC101.02
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV007', 11, 15, 15, NOW()),
('SV008', 11, 15, 11, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Lớp CSC301.02
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV007', 13, 15, 14, NOW()),
('SV008', 13, 15, 14, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Cập nhật course_id trong bảng attendance dựa trên thông tin lớp học
UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P101' AND DATE(a.checkin_time) = '2025-04-21';

UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P301' AND DATE(a.checkin_time) = '2025-04-23';

UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P201' AND DATE(a.checkin_time) = '2025-04-22';

UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P103' AND DATE(a.checkin_time) = '2025-04-21';

-- Thêm dữ liệu tổng hợp khác
-- Thêm một số sinh viên nữa cho lớp CSC101.01 để có đủ dữ liệu thống kê
INSERT INTO student_classes (student_id, class_id, enrolled_date) 
VALUES
('SV011', 1, '2025-01-18'),
('SV012', 1, '2025-01-18'),
('SV013', 1, '2025-01-18'),
('SV014', 1, '2025-01-18'),
('SV015', 1, '2025-01-18');

-- Thống kê điểm danh cho các sinh viên này
INSERT INTO attendance_statistics (student_id, class_id, total_sessions, attended_sessions, last_updated)
VALUES
('SV011', 1, 15, 14, NOW()),
('SV012', 1, 15, 12, NOW()),
('SV013', 1, 15, 10, NOW()),
('SV014', 1, 15, 8, NOW()),
('SV015', 1, 15, 15, NOW())
ON DUPLICATE KEY UPDATE
  total_sessions = VALUES(total_sessions),
  attended_sessions = VALUES(attended_sessions),
  last_updated = VALUES(last_updated);

-- Thêm nhiều dữ liệu điểm danh hơn cho các lớp khác
-- Điểm danh cho lớp CSC501.01 (Thứ 6, phòng P501)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV001', 'RFID001', '2025-04-25 07:25:00', 'P501', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-25 07:28:00', 'P501', TRUE, 'Đúng giờ'),
('SV001', 'RFID001', '2025-04-18 07:25:00', 'P501', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-18 07:50:00', 'P501', TRUE, 'Đi trễ 20 phút'),
('SV001', 'RFID001', '2025-04-11 07:28:00', 'P501', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-11 07:31:00', 'P501', TRUE, 'Đúng giờ'),
('SV001', 'RFID001', '2025-04-04 07:27:00', 'P501', TRUE, 'Đúng giờ'),
('SV002', 'RFID002', '2025-04-04 07:29:00', 'P501', TRUE, 'Đúng giờ');

-- Điểm danh cho lớp CSC102.01 (Thứ 2 buổi chiều, phòng P102)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV003', 'RFID003', '2025-04-21 12:55:00', 'P102', TRUE, 'Đúng giờ'),
('SV004', 'RFID004', '2025-04-21 12:58:00', 'P102', TRUE, 'Đúng giờ'),
('SV003', 'RFID003', '2025-04-14 12:55:00', 'P102', TRUE, 'Đúng giờ'),
('SV004', 'RFID004', '2025-04-14 13:20:00', 'P102', TRUE, 'Đi trễ 20 phút'),
('SV003', 'RFID003', '2025-04-07 12:58:00', 'P102', TRUE, 'Đúng giờ'),
('SV004', 'RFID004', '2025-04-07 13:01:00', 'P102', TRUE, 'Đúng giờ');

-- Điểm danh cho lớp CSC202.01 (Thứ 3, phòng P202)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV005', 'RFID005', '2025-04-22 07:20:00', 'P202', TRUE, 'Đúng giờ'),
('SV006', 'RFID006', '2025-04-22 07:25:00', 'P202', TRUE, 'Đúng giờ'),
('SV005', 'RFID005', '2025-04-15 07:20:00', 'P202', TRUE, 'Đúng giờ'),
('SV006', 'RFID006', '2025-04-15 07:40:00', 'P202', TRUE, 'Đi trễ 10 phút'),
('SV005', 'RFID005', '2025-04-08 07:22:00', 'P202', TRUE, 'Đúng giờ'),
('SV006', 'RFID006', '2025-04-08 07:26:00', 'P202', TRUE, 'Đúng giờ');

-- Điểm danh cho lớp CSC302.01 (Thứ 4, phòng P302)
INSERT INTO attendance (student_id, rfid_uid, checkin_time, room, verified, notes)
VALUES
('SV005', 'RFID005', '2025-04-23 12:58:00', 'P302', TRUE, 'Đúng giờ'),
('SV006', 'RFID006', '2025-04-23 13:01:00', 'P302', TRUE, 'Đúng giờ'),
('SV005', 'RFID005', '2025-04-16 12:59:00', 'P302', TRUE, 'Đúng giờ'),
('SV006', 'RFID006', '2025-04-16 13:20:00', 'P302', TRUE, 'Đi trễ 20 phút'),
('SV005', 'RFID005', '2025-04-09 12:57:00', 'P302', TRUE, 'Đúng giờ'),
('SV006', 'RFID006', '2025-04-09 13:05:00', 'P302', TRUE, 'Đúng giờ');

-- Cập nhật bảng attendance_course_queue cho các bản ghi điểm danh mới
INSERT INTO attendance_course_queue (attendance_id, processed, created_at)
VALUES
(25, TRUE, '2025-04-25 07:25:00'),
(26, TRUE, '2025-04-25 07:28:00'),
(27, TRUE, '2025-04-18 07:25:00'),
(28, TRUE, '2025-04-18 07:50:00'),
(29, TRUE, '2025-04-11 07:28:00'),
(30, TRUE, '2025-04-11 07:31:00'),
(31, TRUE, '2025-04-04 07:27:00'),
(32, TRUE, '2025-04-04 07:29:00'),
(33, TRUE, '2025-04-21 12:55:00'),
(34, TRUE, '2025-04-21 12:58:00'),
(35, TRUE, '2025-04-14 12:55:00'),
(36, TRUE, '2025-04-14 13:20:00'),
(37, TRUE, '2025-04-07 12:58:00'),
(38, TRUE, '2025-04-07 13:01:00'),
(39, TRUE, '2025-04-22 07:20:00'),
(40, TRUE, '2025-04-22 07:25:00'),
(41, TRUE, '2025-04-15 07:20:00'),
(42, TRUE, '2025-04-15 07:40:00'),
(43, TRUE, '2025-04-08 07:22:00'),
(44, TRUE, '2025-04-08 07:26:00'),
(45, TRUE, '2025-04-23 12:58:00'),
(46, TRUE, '2025-04-23 13:01:00'),
(47, TRUE, '2025-04-16 12:59:00'),
(48, TRUE, '2025-04-16 13:20:00'),
(49, TRUE, '2025-04-09 12:57:00'),
(50, TRUE, '2025-04-09 13:05:00');

-- Thêm các sinh viên mới
INSERT INTO students (student_id, rfid_uid, full_name, class, email, phone, address, parent_name, parent_phone, parent_cccd, created_at) 
VALUES 
('SV016', 'RFID016', 'Nguyễn Hải Nam', '21CNTT1', 'nam.nguyenhai@example.com', '0901234576', 'Quận Phú Nhuận, TP HCM', 'Nguyễn Văn Cha', '0912345686', '079123456796', NOW()),
('SV017', 'RFID017', 'Trần Thanh Thảo', '21CNTT1', 'thao.tranthanh@example.com', '0901234577', 'Quận Gò Vấp, TP HCM', 'Trần Văn Cha', '0912345687', '079123456797', NOW()),
('SV018', 'RFID018', 'Phạm Công Vinh', '21CNTT1', 'vinh.phamcong@example.com', '0901234578', 'Quận Bình Thạnh, TP HCM', 'Phạm Văn Cha', '0912345688', '079123456798', NOW()),
('SV019', 'RFID019', 'Lê Thị Hạnh', '21CNTT2', 'hanh.lethi@example.com', '0901234579', 'Quận 3, TP HCM', 'Lê Văn Cha', '0912345689', '079123456799', NOW()),
('SV020', 'RFID020', 'Võ Quốc Bảo', '21CNTT2', 'bao.voquoc@example.com', '0901234580', 'Quận 10, TP HCM', 'Võ Văn Cha', '0912345690', '079123456800', NOW());

-- Tài khoản cho sinh viên mới
INSERT INTO users (username, password, role, student_id, email, created_at) 
VALUES 
('sv016', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV016', 'nam.nguyenhai@example.com', NOW()),
('sv017', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV017', 'thao.tranthanh@example.com', NOW()),
('sv018', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV018', 'vinh.phamcong@example.com', NOW()),
('sv019', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV019', 'hanh.lethi@example.com', NOW()),
('sv020', '$2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe', 'student', 'SV020', 'bao.voquoc@example.com', NOW());

-- Thêm các lớp học mới cho kỳ II
INSERT INTO classes (course_id, teacher_id, class_code, room, semester, schedule_day, start_time, end_time, start_date, end_date, created_at) 
VALUES 
(1, 1, 'CSC101.03', 'P104', '2025-2', 'wednesday', '07:30:00', '10:30:00', '2025-07-15', '2025-10-30', NOW()),
(2, 2, 'CSC201.03', 'P204', '2025-2', 'thursday', '13:00:00', '16:00:00', '2025-07-15', '2025-10-30', NOW()),
(3, 3, 'CSC301.03', 'P304', '2025-2', 'friday', '07:30:00', '10:30:00', '2025-07-15', '2025-10-30', NOW()),
(4, 4, 'CSC401.03', 'P404', '2025-2', 'monday', '13:00:00', '16:00:00', '2025-07-15', '2025-10-30', NOW()),
(5, 5, 'CSC501.03', 'P504', '2025-2', 'tuesday', '07:30:00', '10:30:00', '2025-07-15', '2025-10-30', NOW());

-- Đăng ký sinh viên mới vào các lớp
INSERT INTO student_classes (student_id, class_id, enrolled_date) 
VALUES
('SV016', 16, '2025-06-15'),
('SV017', 16, '2025-06-15'),
('SV018', 16, '2025-06-15'),
('SV019', 17, '2025-06-15'),
('SV020', 17, '2025-06-15'),
('SV016', 18, '2025-06-16'),
('SV017', 18, '2025-06-16'),
('SV018', 18, '2025-06-16'),
('SV019', 19, '2025-06-16'),
('SV020', 19, '2025-06-16');

-- Thêm bảng academic_events nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS academic_events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(100),
    organizer VARCHAR(100),
    event_type ENUM('workshop', 'competition', 'career_fair', 'seminar', 'short_course') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thêm sự kiện học tập
INSERT INTO academic_events (title, description, start_date, end_date, location, organizer, event_type)
VALUES 
('Hội thảo An toàn thông tin', 'Hội thảo về các kỹ thuật bảo mật mới nhất', '2025-05-15', '2025-05-15', 'Hội trường A', 'Khoa CNTT', 'workshop'),
('Cuộc thi Lập trình', 'Cuộc thi lập trình dành cho sinh viên CNTT', '2025-06-10', '2025-06-12', 'Phòng Lab B2', 'CLB Lập trình', 'competition'),
('Ngày hội việc làm CNTT', 'Kết nối sinh viên với các nhà tuyển dụng', '2025-07-05', '2025-07-05', 'Sân trường', 'Phòng Công tác sinh viên', 'career_fair'),
('Seminar về IoT', 'Chia sẻ về công nghệ Internet of Things', '2025-05-20', '2025-05-20', 'Phòng hội thảo C3', 'CLB IoT', 'seminar'),
('Khóa học Blockchain cơ bản', 'Giới thiệu về công nghệ blockchain', '2025-06-01', '2025-06-05', 'Phòng Lab A1', 'Bộ môn HTTT', 'short_course');

-- Thêm thông báo liên quan đến sự kiện học tập
INSERT INTO notifications (user_id, title, message, is_read, created_at)
VALUES
(1, 'Hội thảo An toàn thông tin', 'Mời bạn tham dự Hội thảo An toàn thông tin vào ngày 15/05/2025', FALSE, NOW()),
(2, 'Hội thảo An toàn thông tin', 'Mời bạn tham dự Hội thảo An toàn thông tin vào ngày 15/05/2025', FALSE, NOW()),
(3, 'Cuộc thi Lập trình', 'Đăng ký tham gia Cuộc thi Lập trình từ ngày 10-12/06/2025', FALSE, NOW()),
(4, 'Cuộc thi Lập trình', 'Đăng ký tham gia Cuộc thi Lập trình từ ngày 10-12/06/2025', FALSE, NOW()),
(5, 'Ngày hội việc làm CNTT', 'Mời bạn tham dự Ngày hội việc làm CNTT vào ngày 05/07/2025', FALSE, NOW());

-- Cập nhật course_id cho các dữ liệu điểm danh mới
UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P501' AND DATE(a.checkin_time) >= '2025-04-04' AND DATE(a.checkin_time) <= '2025-04-25';

UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P102' AND DATE(a.checkin_time) >= '2025-04-07' AND DATE(a.checkin_time) <= '2025-04-21';

UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P202' AND DATE(a.checkin_time) >= '2025-04-08' AND DATE(a.checkin_time) <= '2025-04-22';

UPDATE attendance a
JOIN classes c ON a.room = c.room
SET a.course_id = c.course_id
WHERE a.room = 'P302' AND DATE(a.checkin_time) >= '2025-04-09' AND DATE(a.checkin_time) <= '2025-04-23';

-- Kết thúc file dữ liệu mẫu
COMMIT;