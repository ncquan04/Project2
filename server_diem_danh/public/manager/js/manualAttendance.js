// public/manager/js/manualAttendance.js
import { handleError } from '/server_diem_danh/public/assets/js/utils.js';

const DOM = {
    attendanceEntries: document.getElementById('attendanceEntries'),
    confirmationTable: document.getElementById('confirmationTable'),
    confirmationList: document.getElementById('confirmationList')
};

let entries = [];

export function addEntry() {
    const entryDiv = document.createElement('div');
    entryDiv.classList.add('row', 'mb-2');
    entryDiv.innerHTML = `
        <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Mã sinh viên (vd: sv001)" required>
        </div>
        <div class="col-md-6">
            <input type="text" class="form-control" placeholder="Phòng học (vd: P501)" required>
        </div>
    `;
    DOM.attendanceEntries.appendChild(entryDiv);
}

export function collectEntries() {
    const entryDivs = DOM.attendanceEntries.querySelectorAll('.row');
    const entries = [];
    entryDivs.forEach(div => {
        const studentIdInput = div.querySelector('input[placeholder="Mã sinh viên (vd: sv001)"]');
        const roomInput = div.querySelector('input[placeholder="Phòng học (vd: P501)"]');
        if (studentIdInput.value && roomInput.value) {
            entries.push({
                student_id: studentIdInput.value.trim(),
                room: roomInput.value.trim()
            });
        }
    });
    return entries;
}

export function showConfirmation(entries) {
    DOM.confirmationList.innerHTML = '';
    entries.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.student_id}</td>
            <td>${entry.room}</td>
        `;
        DOM.confirmationList.appendChild(row);
    });
    DOM.confirmationTable.style.display = 'block';
}

export async function submitAttendance(entries) {
    try {
        const response = await fetch('/server_diem_danh/api/admin/students.php?action=manual_attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Không thể ghi điểm danh');
        alert(data.message);
        resetForm();
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi ghi điểm danh');
    }
}

export function resetForm() {
    DOM.attendanceEntries.innerHTML = '';
    addEntry();
    DOM.confirmationTable.style.display = 'none';
}