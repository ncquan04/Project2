CREATE DATABASE attendance_test;
USE attendance_test;

CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY,
    rfid_uid VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    class VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    room VARCHAR(10),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,  -- Tên đăng nhập (ví dụ: email hoặc mã SV/GV)
    password VARCHAR(255) NOT NULL,        -- Mật khẩu (lưu dưới dạng hash)
    role ENUM('admin', 'manager', 'student') NOT NULL,  -- Phân quyền
    student_id VARCHAR(10) DEFAULT NULL,    -- Liên kết với bảng students (nếu là sinh viên)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);