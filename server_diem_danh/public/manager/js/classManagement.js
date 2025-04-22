// public/manager/js/classManagement.js
import { loadAttendance } from '/server_diem_danh/public/assets/js/attendanceFilter.js';
import { handleError } from '/server_diem_danh/public/assets/js/utils.js';

/**
 * Đọc file Excel và trả về dữ liệu JSON.
 * @param {File} file - File Excel
 * @returns {Promise<Array>} - Dữ liệu JSON từ file
 */
async function readExcelFile(file) {
    try {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve(json);
            };
            reader.onerror = () => reject(new Error('Không thể đọc file Excel'));
            reader.readAsArrayBuffer(file);
        });
    } catch (error) {
        handleError(error, 'Đã có lỗi xảy ra khi đọc file Excel');
        throw error;
    }
}

/**
 * Tạo hàng HTML cho kết quả điểm danh.
 * @param {Object} record - Dữ liệu sinh viên
 * @returns {string} - Chuỗi HTML của hàng
 */
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

/**
 * Kiểm tra điểm danh dựa trên file Excel và bộ lọc.
 * @param {File} file - File Excel
 * @param {Object} filters - Bộ lọc (date, startTime, endTime, room)
 * @returns {Promise<Array>} - Dữ liệu điểm danh đã xử lý
 */
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

/**
 * Hiển thị kết quả điểm danh.
 * @param {Array} classData - Dữ liệu điểm danh
 */
function displayAttendanceResult(classData) {
    const attendanceList = document.getElementById('attendanceList');
    attendanceList.innerHTML = '';
    classData.forEach(record => {
        attendanceList.innerHTML += createAttendanceRow(record);
    });
    document.getElementById('attendanceResult').style.display = 'block';
}

/**
 * Xuất kết quả điểm danh thành file Excel.
 * @param {Array} classData - Dữ liệu điểm danh
 */
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