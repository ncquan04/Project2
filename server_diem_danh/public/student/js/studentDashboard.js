// public/student/js/studentDashboard.js
import { checkSession } from '/server_diem_danh/public/assets/js/session.js';
import { setupTimeFilter, loadStudentAttendance, loadStudentRooms } from '/server_diem_danh/public/assets/js/attendanceFilter.js';
import { validateFilters, createFilterObject, resetFilters } from '/server_diem_danh/public/assets/js/filterUtils.js';
import { showError, handleError, logout } from '/server_diem_danh/public/assets/js/utils.js';
import { API_URLS } from '/server_diem_danh/public/assets/js/config.js';

// Quản lý các phần tử DOM
const DOM = {
    studentId: document.getElementById('studentId'),
    fullName: document.getElementById('fullName'),
    class: document.getElementById('class'),
    rfidUid: document.getElementById('rfidUid'),
    createdAt: document.getElementById('createdAt'),
    filterDate: document.getElementById('filterDate'),
    filterStartTime: document.getElementById('filterStartTime'),
    filterEndTime: document.getElementById('filterEndTime'),
    filterRoom: document.getElementById('filterRoom'),
    timeFilter: document.getElementById('timeFilter'),
    filterBtn: document.getElementById('filterBtn'),
    resetBtn: document.getElementById('resetBtn'),
    attendanceList: document.getElementById('attendanceList'),
    logoutBtn: document.getElementById('logoutBtn')
};

/**
 * Tải thông tin sinh viên từ API.
 */

async function loadStudentProfile() {
    try {
        const response = await fetch('/server_diem_danh/api/student/profile.php');
        
        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Response is not JSON: ${text}`);
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Không thể tải thông tin sinh viên');
        }

        DOM.studentId.textContent = data.student.student_id || 'N/A';
        DOM.fullName.textContent = data.student.full_name ? decodeURIComponent(data.student.full_name.replace(/\\u([\d\w]{4})/gi, '%u$1')) : 'N/A';
        DOM.class.textContent = data.student.class || 'N/A';
        DOM.rfidUid.textContent = data.student.rfid_uid || 'N/A';
        DOM.createdAt.textContent = data.student.created_at ? new Date(data.student.created_at).toLocaleString('vi-VN') : 'N/A';
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi tải thông tin sinh viên');
    }
}

/**
 * Tạo hàng HTML cho lịch sử điểm danh.
 * @param {Object} record - Bản ghi điểm danh
 * @returns {string} - Chuỗi HTML của hàng
 */
function createAttendanceRow(record) {
    return `
        <tr>
            <td>${record.student_id}</td>
            <td>${record.room}</td>
            <td>${new Date(record.checkin_time).toLocaleString('vi-VN')}</td>
        </tr>
    `;
}

/**
 * Hiển thị lịch sử điểm danh.
 * @param {Object} [filters={}] - Bộ lọc (date, startTime, endTime, room)
 */
async function displayAttendance(filters = {}) {
    try {
        const attendance = await loadStudentAttendance(filters); // Sử dụng hàm mới
        DOM.attendanceList.innerHTML = attendance.map(createAttendanceRow).join('');
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi tải lịch sử điểm danh');
    }
}

/**
 * Khởi tạo trang dashboard sinh viên.
 */
async function initialize() {
    // Tải thông tin sinh viên
    await loadStudentProfile();

    // Thiết lập bộ lọc thời gian
    setupTimeFilter('filterDate', 'timeFilter', 'filterStartTime', 'filterEndTime');

    // Load danh sách phòng học
    try {
        const rooms = await loadStudentRooms(); // Sử dụng hàm mới
        DOM.filterRoom.innerHTML = '<option value="">Chọn phòng</option>';
        rooms.forEach(room => {
            DOM.filterRoom.innerHTML += `<option value="${room}">${room}</option>`;
        });
    } catch (error) {
        handleError(error, 'Không thể load danh sách phòng');
    }

    // Tải lịch sử điểm danh ban đầu
    await displayAttendance();

    // Sự kiện cho nút lọc
    DOM.filterBtn.addEventListener('click', async () => {
        const date = DOM.filterDate.value;
        const startTime = DOM.filterStartTime.value;
        const endTime = DOM.filterEndTime.value;
        const room = DOM.filterRoom.value;

        if (!validateFilters(date, startTime, endTime, room)) return;

        const filters = createFilterObject(date, startTime, endTime, room);
        await displayAttendance(filters);
    });

    // Sự kiện cho nút đặt lại
    DOM.resetBtn.addEventListener('click', () => {
        resetFilters(['filterDate', 'filterStartTime', 'filterEndTime', 'filterRoom'], 'timeFilter');
        displayAttendance();
    });

    // Sự kiện đăng xuất
    DOM.logoutBtn.addEventListener('click', logout);
}

// Khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', initialize);