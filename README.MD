# Hướng Dẫn Triển Khai Server Trên XAMPP

Hướng dẫn này sẽ giúp bạn triển khai server của dự án điểm danh RFID trên XAMPP, bao gồm các bước khởi tạo server, cơ sở dữ liệu, cập nhật URL Ngrok, và kết nối từ ESP32.

## Cấu Trúc Thư Mục

Thư mục `server/` có cấu trúc như sau:

```
server_diem_danh/
├── api/
│   └── api.php              # File API chính
├── config/
│   └── config.php           # File cấu hình (tải biến từ .env và kết nối CSDL)
├── logs/
│   └── error.log            # File log lỗi (sẽ được tạo tự động nếu chưa có)
├── .env                     # File chứa biến môi trường
├── vendor/                  # Thư viện phpdotenv (cài qua Composer)
└── composer.json            # File cấu hình Composer
```

Thư mục `database/` chứa file `schema.sql` để tạo cơ sở dữ liệu và bảng:

```
database/
└── schema.sql               # File SQL để tạo cơ sở dữ liệu và bảng
```

Thư mục `tools/` chứa file `update_ngrok_url.php` để cập nhật URL Ngrok

```
tools/
└── update_ngrok_url.php     # Script PHP để cập nhật URL Ngrok
```


## Yêu Cầu

- **XAMPP**: Đã cài đặt (bao gồm Apache, MySQL, PHP).
- **Ngrok**: Đã cài đặt để tạo URL public.
- **Postman** (khuyến nghị): Để kiểm tra API.
- **Arduino IDE**: Để upload code và dữ liệu vào ESP32.

## Bước 1: Cài Đặt và Khởi Động XAMPP

1. **Tải và cài đặt XAMPP**:
   - Truy cập [https://www.apachefriends.org/](https://www.apachefriends.org/) và tải XAMPP.
   - Cài đặt vào thư mục mặc định (thường là `C:\xampp`).
   - Đảm bảo chọn các thành phần: **Apache**, **MySQL**, và **PHP**.

2. **Khởi động XAMPP**:
   - Mở **XAMPP Control Panel**.
   - Nhấn **Start** cho **Apache** và **MySQL**.
   - Kiểm tra: Truy cập `http://localhost` trên trình duyệt. Nếu thấy trang chào mừng của XAMPP, Apache đã chạy thành công.

## Bước 2: Sao Chép Thư Mục `server/` Vào XAMPP

1. **Tìm thư mục `htdocs`**:
   - Mặc định: `C:\xampp\htdocs`.

2. **Sao chép thư mục `server_diem_danh/`**:
   - Sao chép thư mục `server_diem_danh/` vào `C:\xampp\htdocs\`:

   - Sau khi sao chép, cấu trúc sẽ như sau:
     ```
     C:\xampp\htdocs\
     └── server_diem_danh/
        ├── api/
        │   └── api.php        
        ├── config/
        │   └── config.php      
        ├── logs/
        │   └── error.log     
        ├── .env                 
        ├── vendor/                 
        └── composer.json            
     ```

## Bước 3: Tạo Cơ Sở Dữ Liệu

Cơ sở dữ liệu và bảng sẽ được tạo tự động bằng file `schema.sql` trong thư mục `database/`.

### Nội Dung File `schema.sql`

File `schema.sql` có nội dung sau:

```sql
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
    room VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES students(student_id)
);

-- Dữ liệu mẫu
INSERT INTO students (student_id, rfid_uid, full_name, class) VALUES
('SV001', '1234567890', 'Nguyen Van A', 'CNTT1'),
('SV002', '0987654321', 'Tran Thi B', 'CNTT2');
```

### Nhập File `schema.sql` Vào MySQL

#### Cách 1: Sử Dụng phpMyAdmin
1. Truy cập `http://localhost/phpmyadmin`.
2. Đăng nhập (mặc định: username `root`, password để trống).
3. Chọn tab **Import**.
4. Nhấn **Choose File** và chọn file `D:/myproject/database/schema.sql`.
5. Nhấn **Go** (hoặc **Import**).
6. Kiểm tra: Cơ sở dữ liệu `attendance_system` sẽ được tạo với hai bảng `students` và `attendance`.

#### Cách 2: Sử Dụng Command Line
1. Mở terminal MySQL trong XAMPP:
   - Mở **XAMPP Control Panel** → Nhấn **Shell** bên cạnh **MySQL**.
   - Hoặc:
     ```cmd
     cd C:\xampp\mysql\bin
     mysql -u root -p
     ```
   - Đăng nhập (mặc định: password để trống).
2. Nhập file `schema.sql`:
   ```cmd
   source D:/myproject/database/schema.sql;
   ```
3. Kiểm tra:
   ```cmd
   SHOW DATABASES;
   USE attendance_system;
   SHOW TABLES;
   SELECT * FROM students;
   ```

## Bước 4: Kiểm Tra File `.env`

File `.env` trong `C:\xampp\htdocs\server\.env` chứa các biến môi trường. Đảm bảo nội dung như sau:

```
DB_HOST=localhost
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=attendance_system
API_KEY=Sux6INP4mshX9icXlxjDSlEU3yBZhYR8
URL_SERVER=http://localhost/server/api/api.php
```

- **Lưu ý**:
  - `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` phải khớp với cấu hình MySQL của XAMPP.
  - `URL_SERVER` sẽ được cập nhật sau khi chạy Ngrok.

## Bước 5: Kiểm Tra API

Kiểm tra API cục bộ trước khi tạo URL public.

1. **Truy cập API**:
   - Dùng **Postman** để gửi yêu cầu:
     - **URL**: `http://localhost/server/api/api.php`
     - **Method**: POST
     - **Header**:
       - `X-API-Key: Sux6INP4mshX9icXlxjDSlEU3yBZhYR8`
       - `Content-Type: application/json`
     - **Body** (JSON):
       ```json
       {
           "rfid_uid": "1234567890",
           "room": "P501"
       }
       ```
   - **Kết quả mong đợi**:
     - Thành công: `{"full_name":"NGUYEN VAN A","student_id":"SV001","message":"ĐIỂM DANH THÀNH CÔNG"}`
     - Thất bại: `{"error":"SINH VIEN KHONG TON TAI"}`

2. **Kiểm tra log lỗi**:
   - Nếu có lỗi, xem file `C:\xampp\htdocs\server\logs\error.log`.

## Bước 6: Tạo URL Public Bằng Ngrok

Vì server chạy trên localhost, bạn cần Ngrok để tạo URL public cho ESP32 truy cập.

1. **Chạy Ngrok**:
   - Mở terminal và chạy:
     ```bash
     ngrok http 80
     ```
   - Ngrok sẽ hiển thị URL public, ví dụ: `https://abc123.ngrok.io`.

2. **Cập nhật URL bằng script `update_ngrok_url.php`**:
   - Điều hướng đến thư mục `server/tools/`:
     ```cmd
     cd C:\xampp\htdocs\server\tools
     ```
   - Chạy script:
     ```cmd
     php update_ngrok_url.php
     ```
   - Script sẽ cập nhật URL vào:
     - File `.env`: `URL_SERVER=https://abc123.ngrok.io/server/api/api.php`
     - File `main.cpp` (ESP32): `const char* serverUrl = "https://abc123.ngrok.io/server/api/api.php";`

## Bước 7: Kiểm Tra API Với URL Ngrok

- Dùng Postman để kiểm tra API với URL Ngrok:
  - **URL**: `https://abc123.ngrok.io/server/api/api.php`
  - **Method**, **Header**, và **Body** giống như Bước 5.
- Nếu API hoạt động, bạn đã triển khai thành công.

## Bước 8: Kết Nối Từ ESP32

1. **Upload code và dữ liệu vào ESP32**:
   - Mở Arduino IDE.
   - Upload code từ `D:/myproject/esp32/src/main.cpp`.
   - Upload dữ liệu từ `D:/myproject/esp32/data/` (bao gồm `api_key.txt`) bằng công cụ "ESP32 Sketch Data Upload".
2. ESP32 sẽ gửi yêu cầu đến URL Ngrok và hoạt động như mong đợi.

## Lưu Ý

- **Quyền truy cập file**: Đảm bảo XAMPP có quyền ghi vào thư mục `server/logs/` để ghi log lỗi.
- **HTTPS với Ngrok**: Ngrok cung cấp URL HTTPS, đảm bảo ESP32 hỗ trợ HTTPS (dùng thư viện `HTTPClient` với `https`).
- **Mỗi lần chạy Ngrok**: URL sẽ thay đổi, cần chạy lại script `update_ngrok_url.php` để cập nhật URL.

## Khắc Phục Sự Cố

- **API không hoạt động**:
  - Kiểm tra log lỗi trong `server/logs/error.log`.
  - Đảm bảo Apache và MySQL đang chạy trong XAMPP.
- **Không lấy được URL Ngrok**:
  - Đảm bảo Ngrok đang chạy trước khi chạy script `update_ngrok_url.php`.
- **Cơ sở dữ liệu không tạo được**:
  - Xóa cơ sở dữ liệu cũ (nếu có) bằng `DROP DATABASE attendance_system;` và nhập lại file `schema.sql`.

---
