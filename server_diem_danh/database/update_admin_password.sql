-- File: update_admin_password.sql
-- Script cập nhật mật khẩu admin trong database

USE attendance_system;

-- Cập nhật mật khẩu admin thành 'admin123'
-- Sử dụng hash đã biết: $2y$10$JpZJdHuaXNwGE3kwoL7vzOcDLrI4.ljd/M1b/C5vHWlmyxfJO7Kpe
UPDATE users 
SET password = '$2y$10$yjJ9Y8k3xFoWyP2rhv0WPeRaHF9fUMVH7BBUSR5RZYMrZjwbQiUKG'
WHERE username = 'admin';

-- Hash trên được tạo từ password_hash('admin123', PASSWORD_DEFAULT);
-- Chạy lệnh: mysql -u root -p < update_admin_password.sql