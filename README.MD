# HỆ THỐNG ĐIỂM DANH SINH VIÊN BẰNG THẺ RFID

Hệ thống điểm danh sinh viên tự động sử dụng công nghệ RFID, với thiết bị đọc thẻ ESP32 và hệ thống quản lý toàn diện trên nền tảng web.

## 🚀 Tổng Quan Hệ Thống

Hệ thống điểm danh sinh viên bằng RFID bao gồm các thành phần chính:

1. **🔧 Thiết bị phần cứng ESP32**: Tích hợp đầu đọc RFID, màn hình LCD, kết nối WiFi để đọc thẻ sinh viên và gửi dữ liệu lên server.
2. **⚡ Backend server (PHP)**: Xử lý yêu cầu từ thiết bị ESP32, quản lý dữ liệu điểm danh và cung cấp API RESTful cho frontend.
3. **💻 Frontend (React TypeScript)**: Giao diện người dùng hiện đại với các chức năng tương ứng cho 3 vai trò: admin, giáo viên, và sinh viên.
4. **🗄️ Cơ sở dữ liệu (MySQL)**: Lưu trữ thông tin sinh viên, giáo viên, thẻ RFID, phòng học và dữ liệu điểm danh.

## 👥 Vai Trò Người Dùng

Hệ thống có 3 vai trò người dùng chính với các quyền hạn riêng biệt:

### 🔐 **Admin**
Có toàn quyền truy cập và quản lý hệ thống:
- ✅ **Quản lý sinh viên**: Thêm, sửa, xóa thông tin sinh viên (thủ công hoặc import Excel/CSV)
- ✅ **Quản lý giáo viên**: Thêm, sửa, xóa thông tin giáo viên với tự động tạo tài khoản
- ✅ **Quản lý lớp học**: Tạo và quản lý thông tin lớp học
- ✅ **Quản lý phòng học**: Thiết lập và quản lý phòng học
- ✅ **Quản lý lịch học**: Tạo và quản lý thời khóa biểu
- ✅ **Báo cáo tổng hợp**: Xem báo cáo thống kê toàn hệ thống

### 👨‍🏫 **Giáo viên**
Quản lý điểm danh và lớp học được phân công:
- ✅ **Quản lý lớp học**: Xem danh sách lớp được phân công
- ✅ **Điểm danh sinh viên**: Theo dõi điểm danh theo phòng và thời gian
- ✅ **Báo cáo điểm danh**: Xem và xuất báo cáo điểm danh theo lớp
- ✅ **Điều chỉnh điểm danh**: Chỉnh sửa thông tin điểm danh khi cần thiết
- ✅ **Quản lý thời khóa biểu**: Xem lịch giảng dạy cá nhân

### 👨‍🎓 **Sinh viên**
Theo dõi thông tin điểm danh cá nhân:
- ✅ **Lịch sử điểm danh**: Xem chi tiết điểm danh của bản thân
- ✅ **Thống kê vắng mặt**: Theo dõi số buổi vắng mặt theo từng môn
- ✅ **Thông tin lớp học**: Xem danh sách lớp đang theo học
- ✅ **Thông tin cá nhân**: Quản lý thông tin tài khoản cá nhân

## 📁 Cấu Trúc Dự Án

```
project/
├── 🗄️ database/                 # Thiết lập cơ sở dữ liệu
│   ├── schema.sql              # Cấu trúc bảng và quan hệ database
│   ├── sample_data.sql         # Dữ liệu mẫu cho testing
│   └── update_admin_password.sql # Script cập nhật mật khẩu admin
│
├── 🔧 esp32/                    # Mã nguồn cho thiết bị ESP32
│   ├── data/                   # Dữ liệu cấu hình
│   │   └── api_key.txt         # Khóa API để xác thực với server
│   │
│   ├── diem_danh/              # Dự án Arduino cho ESP32
│   │   ├── diem_danh.ino       # Tập tin chính Arduino
│   │   ├── http_module.*       # Module giao tiếp HTTP với server
│   │   ├── LCD_module.*        # Module điều khiển màn hình LCD
│   │   ├── main.*              # Logic chương trình chính
│   │   ├── rfid_module.*       # Module đọc thẻ RFID MFRC522
│   │   └── wifi_module.*       # Module kết nối WiFi
│   │
│   └── src_backup/             # Bản sao lưu mã nguồn ESP32
│
├── ⚡ server_diem_danh/         # Backend PHP với kiến trúc RESTful
│   ├── 🔌 api/                  # API endpoints
│   │   ├── admin/              # API dành cho admin
│   │   │   ├── students.php    # CRUD quản lý sinh viên + bulk import
│   │   │   ├── teachers.php    # CRUD quản lý giáo viên + bulk import  
│   │   │   ├── classes.php     # CRUD quản lý lớp học
│   │   │   ├── rooms.php       # CRUD quản lý phòng học
│   │   │   ├── schedules.php   # CRUD quản lý lịch học
│   │   │   ├── courses.php     # CRUD quản lý khóa học
│   │   │   ├── bulk_add_students.php # API import hàng loạt sinh viên
│   │   │   └── bulk_add_teachers.php # API import hàng loạt giáo viên
│   │   │
│   │   ├── teacher/            # API dành cho giáo viên
│   │   │   ├── attendance_report.php     # Báo cáo điểm danh
│   │   │   ├── class_attendance_by_date.php # Điểm danh theo ngày
│   │   │   ├── class_students.php        # Danh sách sinh viên lớp
│   │   │   ├── classes.php               # Lớp học được phân công
│   │   │   ├── quick_attendance.php      # Điểm danh nhanh
│   │   │   └── schedule.php              # Lịch giảng dạy
│   │   │
│   │   ├── student/            # API dành cho sinh viên
│   │   │   ├── studentAttendance.php     # Lịch sử điểm danh cá nhân
│   │   │   ├── studentClasses.php        # Lớp học đang theo học
│   │   │   ├── classAttendance.php       # Điểm danh theo lớp
│   │   │   └── profile.php               # Thông tin cá nhân
│   │   │
│   │   ├── esp32/              # API cho thiết bị ESP32
│   │   │   └── esp32_api.php   # Xử lý dữ liệu điểm danh từ ESP32
│   │   │
│   │   ├── auth_api.php        # API xác thực và phân quyền
│   │   ├── login.php           # Xử lý đăng nhập
│   │   ├── logout.php          # Xử lý đăng xuất
│   │   └── utils.php           # Các utility functions
│   │
│   ├── 📋 config/               # Cấu hình hệ thống
│   │   └── config.php          # Cấu hình database, session, security
│   │
│   ├── 🔐 modules/              # Module hệ thống
│   │   ├── Auth.php            # Module xác thực và phân quyền
│   │   ├── CORS.php            # Xử lý Cross-Origin Resource Sharing
│   │   ├── CSRF.php            # Bảo vệ CSRF attacks
│   │   ├── Logger.php          # Hệ thống logging
│   │   ├── RateLimiter.php     # Giới hạn tần suất request
│   │   ├── Response.php        # Chuẩn hóa JSON response
│   │   └── Session.php         # Quản lý session bảo mật
│   │
│   ├── 📊 logs/                 # File logs hệ thống
│   │   ├── app.log             # Log ứng dụng chung
│   │   ├── auth_debug.log      # Log debug xác thực
│   │   ├── error.log           # Log lỗi hệ thống
│   │   └── teacher_api_debug.log # Log API giáo viên
│   │
│   ├── 🔧 tools/                # Công cụ hỗ trợ phát triển
│   │   ├── add_cors_to_api_files.php # Tool thêm CORS header
│   │   └── test_cors.php       # Test CORS functionality
│   │
│   └── 📦 vendor/               # Thư viện PHP (Composer)
│
├── 🛠️ tools/                    # Công cụ hỗ trợ
│   └── update_ngrok_url.php    # Cập nhật URL Ngrok cho ESP32
│
└── 💻 ui/                       # Frontend React TypeScript
    └── em_yeu_truong_em/       # Dự án React với Vite
        ├── 📝 src/              # Mã nguồn frontend
        │   ├── contexts/       # React Context (AuthContext, etc.)
        │   ├── pages/          # Các trang ứng dụng
        │   │   ├── AdminDashboard.tsx          # Trang tổng quan admin
        │   │   ├── AdminStudentsPage.tsx       # Quản lý sinh viên
        │   │   ├── AdminTeachersPage.tsx       # Quản lý giáo viên
        │   │   ├── AdminClassesPage.tsx        # Quản lý lớp học
        │   │   ├── AdminRoomsPage.tsx          # Quản lý phòng học
        │   │   ├── AdminSchedulesPage.tsx      # Quản lý lịch học
        │   │   ├── TeacherDashboard.tsx        # Dashboard giáo viên
        │   │   ├── TeacherClassesPage.tsx      # Lớp học giáo viên
        │   │   ├── TeacherAttendancePage.tsx   # Điểm danh giáo viên
        │   │   ├── StudentDashboard.tsx        # Dashboard sinh viên
        │   │   ├── StudentClassesPage.tsx      # Lớp học sinh viên
        │   │   ├── AttendanceHistory.tsx       # Lịch sử điểm danh
        │   │   ├── LoginPage.tsx               # Trang đăng nhập
        │   │   └── AccountPage.tsx             # Quản lý tài khoản
        │   │
        │   ├── components/     # React components tái sử dụng
        │   │   └── Header.tsx  # Component header chung
        │   │
        │   ├── services/       # Dịch vụ gọi API
        │   │   └── authService.ts # Service xác thực
        │   │
        │   └── assets/         # Tài nguyên tĩnh
        │
        ├── 📁 public/           # Tài nguyên public
        ├── 📋 sample_students.csv # File mẫu import sinh viên
        ├── 📋 sample_teachers.csv # File mẫu import giáo viên
        ├── package.json        # Cấu hình NPM dependencies
        ├── vite.config.ts      # Cấu hình Vite build tool
        ├── tailwind.config.js  # Cấu hình Tailwind CSS
        └── tsconfig.json       # Cấu hình TypeScript
```

## 🛠️ Cài Đặt Và Triển Khai

### ⚠️ Yêu Cầu Hệ Thống

- **XAMPP 8.0+**: Apache, MySQL 8.0+, PHP 8.0+
- **Node.js 18+**: Để phát triển và build frontend
- **Arduino IDE**: Để nạp code vào ESP32
- **Ngrok** (tùy chọn): Để tạo URL public cho ESP32 kết nối từ xa
- **Git**: Để clone và quản lý source code

### 🗄️ Cài Đặt Backend

1. **Cài đặt XAMPP**:
   ```bash
   # Tải và cài đặt XAMPP từ trang chủ
   # https://www.apachefriends.org/
   # Khởi động Apache và MySQL từ XAMPP Control Panel
   ```

2. **Triển khai code Backend**:
   ```bash
   # Clone repository
   git clone <repository-url>
   cd EM_YEU_TRUONG_EM
   
   # Tạo symbolic link từ dự án đến htdocs (Windows)
   mklink /D "C:\xampp\htdocs\server_diem_danh" "C:\path\to\your\project\server_diem_danh"
   
   # Hoặc copy trực tiếp (Linux/Mac)
   sudo ln -s /path/to/project/server_diem_danh /opt/lampp/htdocs/
   ```

3. **Thiết lập cơ sở dữ liệu**:
   ```sql
   -- Truy cập phpMyAdmin: http://localhost/phpmyadmin
   -- Tạo database mới
   CREATE DATABASE attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Import schema và dữ liệu mẫu
   -- File: database/schema.sql
   -- File: database/sample_data.sql
   ```

4. **Cấu hình môi trường**:
   ```bash
   # Tạo file .env trong thư mục server_diem_danh
   cd server_diem_danh
   cp .env.example .env
   ```
   
   Nội dung file `.env`:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USERNAME=root
   DB_PASSWORD=
   DB_NAME=attendance_system
   
   # API Security
   API_KEY=Sux6INP4mshX9icXlxjDSlEU3yBZhYR8
   URL_SERVER=http://localhost/server_diem_danh/api/esp32/esp32_api.php
   
   # Session Security
   SESSION_LIFETIME=3600
   CSRF_TOKEN_LIFETIME=1800
   
   # Rate Limiting
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_WINDOW=3600
   ```

5. **Cài đặt dependencies PHP**:
   ```bash
   # Di chuyển đến thư mục chứa composer.json
   cd server_diem_danh/phpdotenv_lib
   composer install
   ```

### 💻 Cài Đặt Frontend

1. **Cài đặt Node.js và npm**:
   ```bash
   # Tải và cài đặt Node.js từ https://nodejs.org/
   # Kiểm tra phiên bản
   node --version  # >= 18.0.0
   npm --version   # >= 8.0.0
   ```

2. **Cài đặt dependencies**:
   ```bash
   cd ui/em_yeu_truong_em
   npm install
   ```

3. **Cấu hình môi trường frontend**:
   ```bash
   # Tạo file .env.local
   cp .env.example .env.local
   ```
   
   Nội dung file `.env.local`:
   ```env
   VITE_API_URL=http://localhost/server_diem_danh/api
   VITE_APP_NAME="Hệ Thống Điểm Danh"
   VITE_ESP32_API_URL=http://localhost/server_diem_danh/api/esp32/esp32_api.php
   ```

4. **Chạy ứng dụng trong môi trường phát triển**:
   ```bash
   npm run dev
   # Ứng dụng sẽ chạy tại: http://localhost:5173
   ```

5. **Build ứng dụng cho production**:
   ```bash
   npm run build
   npm run preview  # Preview bản build
   ```

### 🔧 Cài Đặt ESP32

1. **Cài đặt Arduino IDE và các thư viện**:
   ```
   Arduino IDE >= 2.0
   Thư viện cần thiết:
   - MFRC522 (v1.4.10+)        # Thư viện RFID
   - WiFi (ESP32 Core)         # Kết nối WiFi
   - HTTPClient (ESP32 Core)   # HTTP requests
   - LiquidCrystal_I2C (v1.1.2+) # Màn hình LCD I2C
   - ArduinoJson (v6.21.3+)    # JSON parsing
   ```

2. **Cấu hình Board Manager**:
   ```
   # Thêm URL ESP32 vào Board Manager:
   https://dl.espressif.com/dl/package_esp32_index.json
   
   # Cài đặt: ESP32 by Espressif Systems (v2.0.11+)
   ```

3. **Cấu hình phần cứng**:
   ```
   ESP32 DevKit V1
   MFRC522 RFID Reader:
   - SDA  -> GPIO 21
   - SCK  -> GPIO 18
   - MOSI -> GPIO 23
   - MISO -> GPIO 19
   - IRQ  -> Not connected
   - GND  -> GND
   - RST  -> GPIO 22
   - 3.3V -> 3.3V
   
   LCD I2C 16x2:
   - VCC -> 5V
   - GND -> GND  
   - SDA -> GPIO 21
   - SCL -> GPIO 22
   ```

4. **Nạp code vào ESP32**:
   ```bash
   # Mở Arduino IDE
   # File -> Open -> esp32/diem_danh/diem_danh.ino
   
   # Cấu hình:
   # Board: "ESP32 Dev Module"
   # CPU Frequency: "240MHz (WiFi/BT)"
   # Flash Mode: "QIO"
   # Flash Size: "4MB (32Mb)"
   # Port: [Chọn COM port của ESP32]
   
   # Upload code
   ```

5. **Cấu hình WiFi và API Key**:
   ```cpp
   // Cập nhật trong wifi_module.cpp
   const char* ssid = "YOUR_WIFI_SSID";
   const char* password = "YOUR_WIFI_PASSWORD";
   
   // Cập nhật server URL trong http_module.cpp
   const char* serverURL = "http://your-server.com/server_diem_danh/api/esp32/esp32_api.php";
   ```

## 🚀 Sử Dụng Hệ Thống

### 🔐 Đăng Nhập Hệ Thống

```
URL: http://localhost:5173
```

**Tài khoản mặc định**:
- **Admin**: 
  - Username: `admin`
  - Password: `admin123`
  - Quyền: Toàn quyền quản lý hệ thống

- **Giáo viên mẫu**:
  - Username: `GV001` (mã nhân viên)
  - Password: `GV001` (mặc định = mã nhân viên)
  - Quyền: Quản lý lớp học và điểm danh

- **Sinh viên mẫu**:
  - Username: `SV001` (mã sinh viên)
  - Password: `SV001` (mặc định = mã sinh viên)
  - Quyền: Xem thông tin điểm danh cá nhân

### 📊 Quy Trình Điểm Danh

1. **Cấu hình thiết bị ESP32**:
   - Kết nối WiFi và cấu hình server URL
   - Kiểm tra kết nối với API server

2. **Quản lý sinh viên (Admin)**:
   - Thêm sinh viên thủ công hoặc import Excel/CSV
   - Gán thẻ RFID cho từng sinh viên
   - Tự động tạo tài khoản đăng nhập

3. **Thiết lập lớp học và lịch (Admin)**:
   - Tạo lớp học và phân công giáo viên
   - Thiết lập thời khóa biểu
   - Cấu hình phòng học

4. **Điểm danh bằng RFID**:
   - Sinh viên quẹt thẻ RFID vào thiết bị
   - Hệ thống hiển thị thông tin trên LCD
   - Dữ liệu được gửi lên server tự động
   - Lưu trữ thông tin: thời gian, phòng học, sinh viên

5. **Theo dõi và báo cáo**:
   - Giáo viên: Xem điểm danh theo lớp và thời gian
   - Sinh viên: Theo dõi lịch sử điểm danh cá nhân
   - Admin: Báo cáo tổng hợp toàn hệ thống

### 📈 Tính Năng Nâng Cao

- **📁 Import hàng loạt**: Hỗ trợ file CSV/Excel cho sinh viên và giáo viên
- **🔍 Tìm kiếm và lọc**: Tìm kiếm nhanh với nhiều tiêu chí
- **📊 Xuất báo cáo**: Export dữ liệu ra Excel/PDF
- **🔔 Thông báo real-time**: Cập nhật điểm danh theo thời gian thực
- **🔒 Bảo mật cao**: CSRF protection, rate limiting, session security
- **📱 Responsive design**: Tương thích mọi thiết bị

## 🔧 API Documentation

### 🔐 Authentication Endpoints
```
POST /api/login.php              # Đăng nhập
POST /api/logout.php             # Đăng xuất  
GET  /api/auth_status.php        # Kiểm tra trạng thái xác thực
```

### 👨‍🎓 Student Management (Admin only)
```
GET  /api/admin/students.php?action=list           # Danh sách sinh viên
POST /api/admin/students.php?action=add            # Thêm sinh viên
POST /api/admin/students.php?action=edit           # Sửa thông tin sinh viên
POST /api/admin/students.php?action=delete         # Xóa sinh viên
POST /api/admin/bulk_add_students.php              # Import hàng loạt
```

### 👨‍🏫 Teacher Management (Admin only)
```
GET  /api/admin/teachers.php?action=list           # Danh sách giáo viên
POST /api/admin/teachers.php?action=add            # Thêm giáo viên
POST /api/admin/teachers.php?action=edit           # Sửa thông tin giáo viên
POST /api/admin/teachers.php?action=delete         # Xóa giáo viên
POST /api/admin/bulk_add_teachers.php              # Import hàng loạt
```

### 🏫 Class & Room Management
```
GET  /api/admin/classes.php?action=list            # Danh sách lớp học
GET  /api/admin/rooms.php?action=list              # Danh sách phòng học
GET  /api/admin/schedules.php?action=list          # Thời khóa biểu
```

### 📊 Attendance Tracking
```
POST /api/esp32/esp32_api.php                      # Gửi dữ liệu từ ESP32
GET  /api/teacher/attendance_report.php            # Báo cáo điểm danh
GET  /api/student/studentAttendance.php            # Lịch sử cá nhân
```

## 🛠️ Troubleshooting

### ❌ Lỗi thường gặp

1. **Database connection failed**:
   ```bash
   # Kiểm tra MySQL service
   # Xác minh thông tin trong config.php
   # Đảm bảo database đã được tạo và import schema
   ```

2. **CORS errors**:
   ```php
   // Kiểm tra CORS headers trong api responses
   // Verify CORS module configuration
   ```

3. **ESP32 không kết nối được**:
   ```cpp
   // Kiểm tra WiFi credentials
   // Verify server URL và API key
   // Check firewall và network settings
   ```

4. **Session timeout**:
   ```php
   // Tăng session lifetime trong config
   // Clear browser cache và cookies
   ```

## 🤝 Đóng Góp

Hệ thống được phát triển với mục đích học tập và nghiên cứu. Contributions are welcome!

### 📋 Development Guidelines
- Follow PSR-12 coding standards cho PHP
- Use TypeScript và ESLint cho frontend
- Write meaningful commit messages
- Test trước khi submit PR

## 📧 Liên Hệ và Hỗ Trợ

- **📧 Email**: [your-email@example.com]
- **🐙 GitHub**: [your-github-profile]
- **📖 Documentation**: Wiki section của repository

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎯 Hệ thống điểm danh RFID - Giải pháp toàn diện cho giáo dục hiện đại**
