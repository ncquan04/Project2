// public/assets/js/attendanceFilter.js

// Load danh sách điểm danh với bộ lọc (dành cho admin/manager)
async function loadAttendance(filters = {}) {
    try {
        const response = await fetch('/server_diem_danh/api/admin/students.php?action=attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters)
        });
        const data = await response.json();
        if (data.success) {
            return data.attendance;
        } else {
            throw new Error(data.error || 'Không thể load thông tin điểm danh');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Load danh sách điểm danh của sinh viên
async function loadStudentAttendance(filters = {}) {
    try {
        const response = await fetch('/server_diem_danh/api/student/studentAttendance.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters)
        });
        const data = await response.json();
        if (data.success) {
            return data.attendance;
        } else {
            throw new Error(data.error || 'Không thể load lịch sử điểm danh');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Load danh sách phòng học
async function loadRooms() {
    try {
        const response = await fetch('/server_diem_danh/api/admin/students.php?action=rooms', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            return data.rooms;
        } else {
            throw new Error('Không thể load danh sách phòng');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function loadStudentRooms() {
    try {
        const response = await fetch('/server_diem_danh/api/student/studentAttendance.php?action=rooms', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            return data.rooms;
        } else {
            throw new Error('Không thể load danh sách phòng');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}


// Hiển thị/ẩn bộ lọc thời gian dựa trên ngày
function setupTimeFilter(dateInputId, timeFilterId, startTimeId, endTimeId) {
    const dateInput = document.getElementById(dateInputId);
    const timeFilter = document.getElementById(timeFilterId);
    const startTimeInput = document.getElementById(startTimeId);
    const endTimeInput = document.getElementById(endTimeId);

    dateInput.addEventListener('change', (e) => {
        timeFilter.style.display = e.target.value ? 'block' : 'none';
        if (!e.target.value) {
            startTimeInput.value = '';
            endTimeInput.value = '';
        }
    });
}

export { loadAttendance, loadRooms, setupTimeFilter, loadStudentAttendance, loadStudentRooms };