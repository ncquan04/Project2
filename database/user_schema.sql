USE attendance_system;

-- Thêm các vai trò mặc định
INSERT INTO roles (role_name, description) VALUES 
('admin', 'Quản trị viên hệ thống, có toàn quyền truy cập'),
('teacher', 'Giáo viên, có quyền quản lý điểm danh và xem báo cáo'),
('student', 'Sinh viên, có quyền xem thông tin điểm danh cá nhân');

-- Tạo tài khoản admin mặc định (password: admin123)
INSERT INTO users (username, password, email, full_name, role_id) 
VALUES ('admin', '$2y$10$8eNTlC/gG8Rz.4m1b3mS5.zd/W3piUUJw2My3YtYHKw6JffcH4P8m', 'admin@example.com', 'Administrator', 1);

-- Thêm một số phòng học mẫu
INSERT INTO rooms (room_id, room_name, capacity, location) VALUES
('P101', 'Phòng 101', 40, 'Tầng 1, Tòa nhà A'),
('P102', 'Phòng 102', 40, 'Tầng 1, Tòa nhà A'),
('P201', 'Phòng 201', 60, 'Tầng 2, Tòa nhà A'),
('P202', 'Phòng 202', 60, 'Tầng 2, Tòa nhà A'),
('P301', 'Phòng Thực hành 1', 30, 'Tầng 3, Tòa nhà B'),
('P302', 'Phòng Thực hành 2', 30, 'Tầng 3, Tòa nhà B');

-- Thêm thiết bị mặc định cho các phòng
INSERT INTO devices (device_id, device_name, room_id, api_key) VALUES
('ESP32-001', 'Thiết bị điểm danh P101', 'P101', CONCAT('api_key_p101_', UUID())),
('ESP32-002', 'Thiết bị điểm danh P102', 'P102', CONCAT('api_key_p102_', UUID())),
('ESP32-003', 'Thiết bị điểm danh P201', 'P201', CONCAT('api_key_p201_', UUID())),
('ESP32-004', 'Thiết bị điểm danh P202', 'P202', CONCAT('api_key_p202_', UUID())),
('ESP32-005', 'Thiết bị điểm danh P301', 'P301', CONCAT('api_key_p301_', UUID())),
('ESP32-006', 'Thiết bị điểm danh P302', 'P302', CONCAT('api_key_p302_', UUID()));

-- Lưu ý: Ở đây sử dụng bcrypt để mã hóa mật khẩu. Mật khẩu mặc định cho admin là 'admin123'
-- Trong môi trường thực tế, cần thay đổi mật khẩu này sau khi cài đặt