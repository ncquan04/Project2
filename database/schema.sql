CREATE DATABASE attendance_system;
USE attendance_system;

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
    rfid_uid VARCHAR(50),
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    room VARCHAR(10),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);