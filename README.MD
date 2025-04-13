# HỆ THỐNG ĐIỂM DANH SINH VIÊN BẰNG THẺ RFID

Hệ thống điểm danh sinh viên tự động sử dụng công nghệ RFID, với thiết bị đọc thẻ ESP32 và hệ thống quản lý trên nền tảng web.

## Tổng Quan Hệ Thống

Hệ thống điểm danh sinh viên bằng RFID bao gồm các thành phần chính:

1. **Thiết bị phần cứng ESP32**: Tích hợp đầu đọc RFID, màn hình LCD, kết nối WiFi để đọc thẻ sinh viên và gửi dữ liệu lên server.
2. **Backend server (PHP)**: Xử lý yêu cầu từ thiết bị ESP32, quản lý dữ liệu điểm danh và cung cấp API cho frontend.
3. **Frontend (React TypeScript)**: Giao diện người dùng với các chức năng tương ứng cho 3 vai trò: admin, giáo viên, và sinh viên.
4. **Cơ sở dữ liệu (MySQL)**: Lưu trữ thông tin sinh viên, thẻ RFID, phòng học và dữ liệu điểm danh.

## Vai Trò Người Dùng

Hệ thống có 3 vai trò người dùng chính:

1. **Admin**: Có toàn quyền truy cập và quản lý hệ thống
   - Quản lý tài khoản người dùng
   - Quản lý thiết bị và phòng học
   - Xem báo cáo tổng hợp

2. **Giáo viên**: Quản lý điểm danh lớp học
   - Chọn phòng học và buổi học
   - Xem danh sách điểm danh
   - Điều chỉnh thông tin điểm danh khi cần

3. **Sinh viên**: Xem thông tin điểm danh cá nhân
   - Xem lịch sử điểm danh của bản thân
   - Theo dõi số buổi vắng mặt

## Cấu Trúc Dự Án

```
project/
├── database/                 # Tập tin thiết lập cơ sở dữ liệu
│   ├── schema.sql            # Cấu trúc bảng và quan hệ
│   └── user_schema.sql       # Dữ liệu mẫu và tài khoản khởi tạo
│
├── esp32/                    # Mã nguồn cho thiết bị ESP32
│   ├── data/                 # Dữ liệu cấu hình
│   │   └── api_key.txt       # Khóa API để xác thực với server
│   │
│   ├── diem_danh/            # Dự án Arduino cho ESP32
│   │   ├── diem_danh.ino     # Tập tin chính Arduino
│   │   ├── http_module.*     # Module giao tiếp HTTP
│   │   ├── LCD_module.*      # Module điều khiển màn hình LCD
│   │   ├── main.*            # Chương trình chính
│   │   ├── rfid_module.*     # Module đọc thẻ RFID
│   │   └── wifi_module.*     # Module kết nối WiFi
│   │
│   └── src_backup/           # Bản sao lưu mã nguồn
│
├── server_diem_danh/         # Backend PHP
│   ├── api/                  # API endpoints
│   │   ├── api.php           # API chính xử lý điểm danh
│   │   └── auth_api.php      # API xác thực người dùng
│   │
│   ├── config/               # Cấu hình hệ thống
│   │   └── config.php        # Cấu hình kết nối database và session
│   │
│   ├── vendor/               # Thư viện PHP (do Composer quản lý)
│   ├── composer.json         # Cấu hình Composer
│   ├── composer.lock         # Khóa phiên bản thư viện
│   └── reset_admin_password.php  # Công cụ đặt lại mật khẩu admin
│
├── tools/                    # Công cụ hỗ trợ
│   └── update_ngrok_url.php  # Cập nhật URL Ngrok cho ESP32
│
└── ui/                       # Frontend React TypeScript
    └── em_yeu_truong_em/     # Dự án React
        ├── src/              # Mã nguồn
        │   ├── contexts/     # Context API React
        │   ├── pages/        # Các trang ứng dụng
        │   ├── services/     # Dịch vụ gọi API
        │   └── assets/       # Tài nguyên (hình ảnh, biểu tượng)
        │
        ├── public/           # Tài nguyên tĩnh
        ├── package.json      # Cấu hình NPM
        └── vite.config.ts    # Cấu hình Vite
```

## Cài Đặt Và Triển Khai

### Yêu Cầu Hệ Thống

- **XAMPP**: Apache, MySQL, PHP
- **Node.js**: v14 trở lên cho phát triển frontend
- **Arduino IDE**: Để nạp code vào ESP32
- **Ngrok** (tùy chọn): Để tạo URL public cho ESP32 kết nối từ xa

### Cài Đặt Backend

1. **Cài đặt XAMPP**:
   - Tải và cài đặt XAMPP từ [trang chủ](https://www.apachefriends.org/)
   - Khởi động Apache và MySQL

2. **Triển khai code Backend**:
   - Copy thư mục `server_diem_danh` vào thư mục `htdocs` của XAMPP
   - Hoặc tạo symbolic link từ thư mục dự án đến htdocs:
     ```
     mklink /D "C:\xampp\htdocs\server_diem_danh" "C:\Users\Quan\Code\EM_YEU_TRUONG_EM\server_diem_danh"
     ```

3. **Thiết lập cơ sở dữ liệu**:
   - Truy cập phpMyAdmin: http://localhost/phpmyadmin
   - Tạo cơ sở dữ liệu mới và nhập file `schema.sql` 
   - Nhập file `user_schema.sql` để tạo dữ liệu ban đầu

4. **Cấu hình .env**:
   - Tạo file `.env` trong thư mục `server_diem_danh` với nội dung:
     ```
     DB_HOST=localhost
     DB_USERNAME=root
     DB_PASSWORD=
     DB_NAME=attendance_system
     API_KEY=Sux6INP4mshX9icXlxjDSlEU3yBZhYR8
     URL_SERVER=http://localhost/server_diem_danh/api/api.php
     ```

### Cài Đặt Frontend

1. **Cài đặt Node.js và npm**:
   - Tải và cài đặt Node.js từ [trang chủ](https://nodejs.org/)

2. **Cài đặt dependencies**:
   ```bash
   cd ui/em_yeu_truong_em
   npm install
   ```

3. **Chạy ứng dụng trong môi trường phát triển**:
   ```bash
   npm run dev
   ```

4. **Build ứng dụng cho production**:
   ```bash
   npm run build
   ```

### Cài Đặt ESP32

1. **Cài đặt Arduino IDE và các thư viện cần thiết**:
   - MFRC522 (Thư viện RFID)
   - WiFi
   - HTTPClient
   - LiquidCrystal_I2C

2. **Nạp code vào ESP32**:
   - Mở file `esp32/diem_danh/diem_danh.ino` trong Arduino IDE
   - Chọn board ESP32 và cổng COM thích hợp
   - Nạp code vào ESP32

3. **Cấu hình WiFi và API Key**:
   - Cập nhật thông tin WiFi trong `wifi_module.cpp`
   - Sao chép file `api_key.txt` vào thư mục data
   - Sử dụng "ESP32 Sketch Data Upload" để nạp dữ liệu

## Sử Dụng Hệ Thống

### Đăng Nhập

- Truy cập http://localhost:5173 (hoặc URL được hiển thị khi chạy frontend)
- Đăng nhập với tài khoản mặc định:
  - Admin: username `admin`, password `admin123`

### Điểm Danh Bằng RFID

1. Sinh viên quẹt thẻ RFID vào thiết bị đọc
2. Hệ thống hiển thị thông tin sinh viên trên màn hình LCD
3. Dữ liệu được gửi lên server và lưu vào cơ sở dữ liệu
4. Giáo viên có thể xem danh sách điểm danh theo phòng học và thời gian

## Liên Hệ và Hỗ Trợ

Nếu bạn có câu hỏi hoặc cần hỗ trợ, vui lòng liên hệ:
- Email: [your-email@example.com]
- GitHub: [your-github-profile]

---
