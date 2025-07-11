import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import teacherService, { AttendanceRecord, ClassInfo } from '../services/teacherService';
import Header from '../components/Header';
import AttendanceView from '../components/AttendanceView';

function getWeekdayNumber(weekday: string): number {
  // Chuyển tên thứ tiếng Anh sang số (0: Chủ nhật, 1: Thứ 2, ...)
  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return map[weekday?.toLowerCase?.()] ?? 0;
}

// Extend ClassInfo to allow startDate, endDate, schedule_day
interface ClassInfoWithSchedule extends ClassInfo {
  startDate?: string;
  endDate?: string;
  schedule_day?: string;
}

const getStartTimeFromSchedule = (schedule: string): string => {
  // schedule: 'Thứ Hai (07:30 - 09:30)' => return '07:30:00'
  const match = schedule.match(/\((\d{1,2}:\d{2})/);
  if (match && match[1]) {
    return match[1] + ':00';
  }
  return '07:30:00';
};

const TeacherClassAttendancePage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfoWithSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validDates, setValidDates] = useState<string[]>([]); // Danh sách ngày học hợp lệ
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);

  // Tạo danh sách ngày học hợp lệ dựa trên lịch học
  function generateValidDates(startDate: string, endDate: string, weekday: string) {
    const result: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const weekdayNum = getWeekdayNumber(weekday);
    // Tìm ngày đầu tiên đúng thứ
    let current = new Date(start);
    current.setHours(12,0,0,0); // Đặt giờ giữa ngày để tránh lệch timezone
    let loopCount = 0;
    while (current.getDay() !== weekdayNum) {
      if (loopCount++ > 10) {
        console.error('Infinite loop protection in generateValidDates', {startDate, endDate, weekday, weekdayNum});
        break;
      }
      current.setDate(current.getDate() + 1);
    }
    // Lặp qua từng tuần cho đến hết
    while (current <= end) {
      // Tạo yyyy-mm-dd theo local time
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      console.log('DEBUG generateValidDates push:', dateStr, 'getDay:', current.getDay(), 'weekdayNum:', weekdayNum);
      result.push(dateStr);
      current.setDate(current.getDate() + 7);
    }
    return result;
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      try {
        setLoading(true);
        const classData = await teacherService.getClassSchedule(Number(classId));
        setClassInfo(classData);
        // Sinh danh sách ngày học hợp lệ
        const classDataWithSchedule = classData as ClassInfoWithSchedule;
        if (classDataWithSchedule?.startDate && classDataWithSchedule?.endDate && classDataWithSchedule?.schedule) {
          let weekday = '';
          if (classDataWithSchedule.schedule.toLowerCase().includes('thứ') || classDataWithSchedule.schedule.toLowerCase().includes('chủ nhật')) {
            // Lấy đúng tên thứ tiếng Việt ở đầu chuỗi
            const scheduleLower = classDataWithSchedule.schedule.toLowerCase();
            let weekdayKey = '';
            if (scheduleLower.startsWith('chủ nhật')) {
              weekdayKey = 'chủ nhật';
            } else {
              // Lấy "thứ hai", "thứ ba", ... (có dấu)
              const match = scheduleLower.match(/thứ [a-zA-Zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+/);
              if (match) {
                weekdayKey = match[0];
              } else {
                console.warn('Không tìm thấy thứ trong lịch:', classDataWithSchedule.schedule);
              }
            }
            // Map sang tiếng Anh
            const vi2en: Record<string, string> = {
              'thứ hai': 'monday',
              'thứ ba': 'tuesday',
              'thứ tư': 'wednesday',
              'thứ năm': 'thursday',
              'thứ sáu': 'friday',
              'thứ bảy': 'saturday',
              'chủ nhật': 'sunday',
            };
            weekday = vi2en[weekdayKey] || '';
            console.log('DEBUG weekdayKey:', weekdayKey, '=> weekday:', weekday);
            if (!weekday) {
              console.warn('Không map được thứ tiếng Việt sang tiếng Anh:', weekdayKey);
            }
          } else if (classDataWithSchedule.schedule_day) {
            weekday = classDataWithSchedule.schedule_day;
          }
          if (weekday) {
            const weekdayNum = getWeekdayNumber(weekday);
            console.log('DEBUG weekday:', weekday, '=> weekdayNum:', weekdayNum);
            const valid = generateValidDates(classDataWithSchedule.startDate, classDataWithSchedule.endDate, weekday);
            setValidDates(valid);
            // Chọn ngày hôm nay nếu hợp lệ, nếu không chọn ngày đầu tiên
            const today = new Date().toISOString().split('T')[0];
            setSelectedDate(valid.includes(today) ? today : valid[0] || '');
          } else {
            setValidDates([]);
            setSelectedDate('');
          }
        }
      } catch (err) {
        setError('Không thể tải thông tin lớp học. Vui lòng thử lại sau.');
        console.error('Error fetching class info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!classId || !selectedDate) return;
      try {
        setLoading(true);
        const attendanceData = await teacherService.getClassAttendanceByDate(Number(classId), selectedDate);
        setAttendance(attendanceData);
        setError(null);
      } catch (err) {
        setError('Không thể tải thông tin điểm danh. Vui lòng thử lại sau.');
        setAttendance([]);
        console.error('Error fetching attendance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [classId, selectedDate]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!classId) return;
      try {
        const studentsData = await teacherService.getClassStudents(Number(classId));
        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching students:', err);
      }
    };
    fetchStudents();
  }, [classId]);  const handleExportAttendance = (format: 'csv' | 'pdf' | 'excel') => {
    if (!classInfo || !attendance.length || !students.length) {
      alert('Không có dữ liệu để xuất. Vui lòng chọn ngày có dữ liệu điểm danh.');
      return;
    }

    try {
      // Chuẩn bị dữ liệu xuất
      const exportData = [];
        // Header
      const header = [
        'STT',
        'MSSV', 
        'Họ và tên',
        'Lớp',
        'Trạng thái'
      ];
      exportData.push(header);

      // Dữ liệu sinh viên và điểm danh
      let index = 1;
      students.forEach(student => {
        const attendanceRecord = attendance.find(att => 
          String(att.student_id || att.studentId) === String(student.student_id)
        );
        const status = attendanceRecord?.attendance?.status || 'Vắng';
        
        const row = [
          index++,
          student.student_id,
          student.full_name || student.name,
          student.class || student.student_class || '',
          status === 'present' ? 'Có mặt' : 
          status === 'late' ? 'Muộn' : 
          status === 'absent' ? 'Vắng' : status
        ];
        exportData.push(row);
      });

      if (format === 'csv') {
        // Xuất CSV
        const csvContent = exportData.map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        
        // Thêm BOM để Excel đọc được UTF-8
        const blob = new Blob(['\ufeff' + csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `diem_danh_${classInfo.name || classId}_${selectedDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
      } else if (format === 'excel') {
        // Xuất Excel (dạng HTML table để Excel có thể mở)
        let htmlContent = `
          <html>
            <head>
              <meta charset="utf-8">
              <title>Điểm danh lớp ${classInfo.name}</title>
            </head>
            <body>
              <h2>Điểm danh lớp ${classInfo.name}</h2>
              <p>Ngày: ${new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
              <p>Phòng: ${classInfo.room}</p>
              <p>Môn học: ${classInfo.subject}</p>
              <table border="1" cellpadding="5" cellspacing="0">`;
        
        exportData.forEach((row, rowIndex) => {
          htmlContent += '<tr>';
          row.forEach(cell => {
            const tag = rowIndex === 0 ? 'th' : 'td';
            htmlContent += `<${tag}>${String(cell)}</${tag}>`;
          });
          htmlContent += '</tr>';
        });
        
        htmlContent += `
              </table>
            </body>
          </html>`;
        
        const blob = new Blob([htmlContent], { 
          type: 'application/vnd.ms-excel;charset=utf-8;' 
        });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `diem_danh_${classInfo.name || classId}_${selectedDate}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
          } else if (format === 'pdf') {
        // Để xuất PDF, chúng ta sẽ mở cửa sổ in
        let printContent = `
          <html>
            <head>
              <meta charset="utf-8">
              <title>Điểm danh lớp ${classInfo.name}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h2 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .info { margin-bottom: 10px; }
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              <h2>Điểm danh lớp ${classInfo.name}</h2>
              <div class="info">
                <p><strong>Ngày:</strong> ${new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                <p><strong>Phòng:</strong> ${classInfo.room}</p>
                <p><strong>Môn học:</strong> ${classInfo.subject}</p>
              </div>
              <table>`;
        
        exportData.forEach((row, rowIndex) => {
          printContent += '<tr>';
          row.forEach(cell => {
            const tag = rowIndex === 0 ? 'th' : 'td';
            printContent += `<${tag}>${String(cell)}</${tag}>`;
          });
          printContent += '</tr>';
        });
        
        printContent += `
              </table>
            </body>
          </html>`;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(printContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        }
      }
      
    } catch (err) {
      console.error(`Error exporting attendance as ${format}:`, err);
      alert(`Không thể xuất dữ liệu điểm danh dưới dạng ${format.toUpperCase()}. Vui lòng thử lại sau.`);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                to="/teacher/classes" 
                className="text-blue-600 hover:text-blue-800 mr-2"
              >
                Lớp giảng dạy
              </Link>
              <span className="text-gray-500">/</span>
              <Link
                to={`/teacher/classes/${classId}/students`}
                className="text-blue-600 hover:text-blue-800 mx-2"
              >
                {classInfo?.name}
              </Link>
              <span className="text-gray-500">/</span>
              <span className="ml-2 text-gray-600">Điểm danh</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Điểm danh lớp học</h1>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Link
              to={`/teacher/classes/${classId}/schedule`}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lịch học
            </Link>
          </div>
        </div>

        {/* Date Selector and Export Controls */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 md:mb-0">
              <div>
                <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn buổi học:
                </label>
                <select
                  id="date-select"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="shadow-sm text-black focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  {validDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  if (validDates.includes(today)) setSelectedDate(today);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hôm nay
              </button>
            </div>            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExportAttendance('csv')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Xuất CSV
              </button>
              <button
                onClick={() => handleExportAttendance('excel')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Xuất Excel
              </button>
              <button
                onClick={() => handleExportAttendance('pdf')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Xuất PDF
              </button>
            </div>
          </div>
        </div>

        {/* Class Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Mã lớp</p>
              <p className="font-medium text-gray-900">#{classInfo?.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tên lớp</p>
              <p className="font-medium text-gray-900">{classInfo?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Môn học</p>
              <p className="font-medium text-gray-900">{classInfo?.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phòng học</p>
              <p className="font-medium text-gray-900">{classInfo?.room}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        ) : (
          <>            {/* Attendance Table */}
            {attendance.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Danh sách điểm danh ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
                  </h2>
                </div>
                {/* Use the AttendanceView component */}
                <AttendanceView 
                  attendance={attendance}
                  students={students}
                  date={selectedDate}
                  onUpdateAttendance={async (record, status) => {
                    console.log('[TeacherClassAttendancePage] onUpdateAttendance received:', record, status);
                    console.log('DEBUG onUpdateAttendance record:', record);
                    console.log('DEBUG onUpdateAttendance status:', status);
                    let success = false;
                    if (!classInfo) throw new Error('Missing class info');
                    const startTime = classInfo.start_time || getStartTimeFromSchedule(classInfo.schedule);
                    const checkin_time = selectedDate + ' ' + startTime;                    const class_id = classInfo.id;
                    const student_id = String(record.student_id || record.studentId).trim();
                    const payload = {
                      status,
                      checkin_time,
                      room: classInfo.room,
                      class_id: Number(class_id),
                      student_id, // luôn trim để tránh lỗi foreign key
                      rfid_uid: record.rfid_uid || '',
                      attendanceId: record.attendance?.attendance_id || 0, // Lấy attendance_id đúng từ object attendance
                    };
                    console.log('DEBUG onUpdateAttendance payload:', payload);
                    success = await teacherService.updateAttendance(payload);
                    if (success && classId && selectedDate) {
                      const updated = await teacherService.getClassAttendanceByDate(Number(classId), selectedDate);
                      setAttendance(updated);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 text-lg mb-4">Không có dữ liệu điểm danh cho ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
                <div className="mt-4">
                  <Link
                    to={`/teacher/quick-attendance?classId=${classId}&date=${selectedDate}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Điểm danh mới
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherClassAttendancePage;