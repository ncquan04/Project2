// public/manager/js/eventHandlers.js
import { loadRooms } from '/server_diem_danh/public/assets/js/attendanceFilter.js';
import { checkAttendance, displayAttendanceResult, exportToExcel } from './classManagement.js';
import { validateFilters, createFilterObject } from '/server_diem_danh/public/assets/js/filterUtils.js';
import { logout, handleError } from '/server_diem_danh/public/assets/js/utils.js';
import { addEntry, collectEntries, showConfirmation, submitAttendance, resetForm } from './manualAttendance.js';

let classData = []; // Lưu dữ liệu điểm danh

/**
 * Thiết lập tất cả các sự kiện DOM cho dashboard manager.
 */
export async function setupEventListeners() {
    // Load danh sách phòng học cho tab "Xuất thông tin điểm danh"
    try {
        const rooms = await loadRooms();
        const roomSelect = document.getElementById('filterRoom');
        roomSelect.innerHTML = '<option value="">Chọn phòng</option>';
        rooms.forEach(room => {
            roomSelect.innerHTML += `<option value="${room}">${room}</option>`;
        });
    } catch (error) {
        handleError(error, 'Không thể load danh sách phòng');
    }

    // Sự kiện cho tab "Xuất thông tin điểm danh"
    document.getElementById('classForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('classFile');
        const date = document.getElementById('filterDate').value;
        const startTime = document.getElementById('filterStartTime').value;
        const endTime = document.getElementById('filterEndTime').value;
        const room = document.getElementById('filterRoom').value;

        if (!fileInput.files.length || !date || !startTime || !endTime || !room) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }

        if (!validateFilters(date, startTime, endTime, room)) return;

        const filters = createFilterObject(date, startTime, endTime, room);
        try {
            classData = await checkAttendance(fileInput.files[0], filters);
            displayAttendanceResult(classData);
        } catch (error) {
            // Lỗi đã được xử lý trong checkAttendance
        }
    });

    document.getElementById('exportBtn').addEventListener('click', () => {
        exportToExcel(classData);
    });

    // Sự kiện cho tab "Ghi điểm danh thủ công"
    document.getElementById('addEntryBtn').addEventListener('click', addEntry);

    document.getElementById('manualAttendanceForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const entries = collectEntries();
        if (entries.length === 0) {
            alert('Vui lòng nhập ít nhất một dòng dữ liệu');
            return;
        }
        showConfirmation(entries);
        // Lưu entries vào biến toàn cục để sử dụng trong confirmBtn
        window.manualEntries = entries;
    });

    document.getElementById('confirmBtn').addEventListener('click', async () => {
        await submitAttendance(window.manualEntries);
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.getElementById('confirmationTable').style.display = 'none';
    });

    // Sự kiện đăng xuất (chung cho cả hai tab)
    document.getElementById('logoutBtn').addEventListener('click', logout);
}