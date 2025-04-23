import { loadAttendance } from '/server_diem_danh/public/assets/js/attendanceFilter.js';
import { handleError } from '/server_diem_danh/public/assets/js/utils.js';
import { readExcelFile } from '/server_diem_danh/public/assets/js/excelUtils.js';

function createAttendanceRow(record) {
    return `
        <tr>
            <td>${record['Số thứ tự']}</td>
            <td>${record['Mã sinh viên']}</td>
            <td>${record['Họ tên sinh viên']}</td>
            <td>${record['Lớp']}</td>
            <td>${record['Trạng thái']}</td>
        </tr>
    `;
}

async function checkAttendance(file, filters) {
    try {
        const classData = await readExcelFile(file);
        if (!classData.length) {
            throw new Error('File Excel trống hoặc không hợp lệ');
        }

        const attendanceRecords = await loadAttendance(filters);
        const room = filters.room;

        const processedData = classData.map(record => {
            const studentId = record['Mã sinh viên'];
            const hasAttended = attendanceRecords.some(att => att.student_id === studentId && att.room === room);
            record['Trạng thái'] = hasAttended ? 'Đi học' : 'Vắng';
            return record;
        });

        return processedData;
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi kiểm tra điểm danh');
        throw error;
    }
}

function displayAttendanceResult(classData) {
    const attendanceList = document.getElementById('attendanceList');
    attendanceList.innerHTML = '';
    classData.forEach(record => {
        attendanceList.innerHTML += createAttendanceRow(record);
    });
    document.getElementById('attendanceResult').style.display = 'block';
}

function exportToExcel(classData) {
    try {
        if (!classData || classData.length === 0) {
            throw new Error('Không có dữ liệu để xuất file Excel');
        }

        const exportData = classData.map(item => ({
            'Số thứ tự': item['Số thứ tự'],
            'Mã sinh viên': item['Mã sinh viên'],
            'Họ tên sinh viên': item['Họ tên sinh viên'],
            'Lớp': item['Lớp'],
            'Trạng thái': item['Trạng thái']
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DiemDanh');

        const fileName = `diem_danh_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName, { bookType: 'xlsx', type: 'binary' });
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi xuất file Excel');
    }
}

export { checkAttendance, displayAttendanceResult, exportToExcel };