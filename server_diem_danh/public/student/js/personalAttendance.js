// public/student/js/personalManagement.js
import { loadStudentAttendance, loadStudentRooms } from '/server_diem_danh/public/assets/js/attendanceFilter.js';
import { handleError } from '/server_diem_danh/public/assets/js/utils.js';

// Quản lý các phần tử DOM liên quan đến điểm danh
const DOM = {
    filterRoom: document.getElementById('filterRoom'),
    attendanceList: document.getElementById('attendanceList')
};

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
        const attendance = await loadStudentAttendance(filters);
        DOM.attendanceList.innerHTML = attendance.map(createAttendanceRow).join('');
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi tải lịch sử điểm danh');
    }
}

/**
 * Khởi tạo module điểm danh: load danh sách phòng và hiển thị điểm danh ban đầu.
 */
export async function initializeAttendance() {
    try {
        const rooms = await loadStudentRooms();
        DOM.filterRoom.innerHTML = '<option value="">Chọn phòng</option>';
        rooms.forEach(room => {
            DOM.filterRoom.innerHTML += `<option value="${room}">${room}</option>`;
        });
    } catch (error) {
        handleError(error, 'Không thể load danh sách phòng');
    }

    await displayAttendance();
}

export { displayAttendance }; // Export để sử dụng trong eventHandlers.js