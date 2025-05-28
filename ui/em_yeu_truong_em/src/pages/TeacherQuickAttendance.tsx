import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import teacherService, { ClassInfo, Student } from '../services/teacherService';
import TeacherHeader from '../components/TeacherHeader';

function getWeekdayNumber(weekday: string) {
  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    'chủ nhật': 0,
    'thứ hai': 1,
    'thứ ba': 2,
    'thứ tư': 3,
    'thứ năm': 4,
    'thứ sáu': 5,
    'thứ bảy': 6,
  };
  return map[weekday?.toLowerCase?.()] ?? 0;
}

function generateValidDates(startDate: string, endDate: string, weekday: string) {
  const result: string[] = [];
  if (!startDate || !endDate || !weekday) return result;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const weekdayNum = getWeekdayNumber(weekday);
  let current = new Date(start);
  current.setHours(0,0,0,0);
  while (current.getDay() !== weekdayNum) {
    current.setDate(current.getDate() + 1);
  }
  while (current <= end) {
    result.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 7);
  }
  return result;
}

const TeacherQuickAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const classId = searchParams.get('classId');
  const preselectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classId || '');
  const [selectedDate, setSelectedDate] = useState<string>(preselectedDate);
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Student attendance status map
  const [attendanceStatus, setAttendanceStatus] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [validDates, setValidDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setClassLoading(true);
        const classesData = await teacherService.getTeacherClasses();
        // Map data to ClassInfo interface (handle backend field names)
        const mapped = classesData.map((item: any) => ({
          id: item.class_id ?? item.id,
          name: item.class_code ?? item.name,
          subject: item.course_name ?? item.subject,
          schedule: item.schedule_day && item.start_time && item.end_time
            ? `${item.schedule_day} (${item.start_time} - ${item.end_time})`
            : item.schedule,
          room: item.room,
          startDate: item.start_date,
          endDate: item.end_date,
          schedule_day: item.schedule_day,
        }));
        setClasses(mapped);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
      } finally {
        setClassLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Khi chọn lớp, lấy chi tiết lịch học và sinh ngày hợp lệ
  useEffect(() => {
    const fetchClassDetail = async () => {
      if (!selectedClassId) {
        setValidDates([]);
        return;
      }
      try {
        const detail = await teacherService.getClassSchedule(Number(selectedClassId));
        // Phân tích tất cả các weekday từ detail.schedule (ví dụ: 'Thứ 2, 4 (07:30 - 09:30)')
        let weekdays: string[] = [];
        if (detail.schedule && detail.schedule.toLowerCase().includes('thứ')) {
          // Lấy phần trước dấu '(' và tách bởi dấu ',')
          const schedulePart = detail.schedule.split('(')[0];
          // Tách các ngày, ví dụ: 'Thứ 2, 4' => ['Thứ 2', '4']
          weekdays = schedulePart.split(',').map(s => s.trim().toLowerCase());
          // Chuẩn hóa: nếu chỉ là số, ghép với 'thứ'
          weekdays = weekdays.map(w => {
            if (/^\d$/.test(w)) return 'thứ ' + w;
            return w;
          });
        } else if ((detail as any).schedule_day) {
          weekdays = [((detail as any).schedule_day).toLowerCase()];
        }
        // Chuyển sang tiếng Anh nếu cần
        const vi2en: Record<string, string> = {
          'thứ hai': 'monday',
          'thứ ba': 'tuesday',
          'thứ tư': 'wednesday',
          'thứ năm': 'thursday',
          'thứ sáu': 'friday',
          'thứ bảy': 'saturday',
          'chủ nhật': 'sunday',
          'thứ 2': 'monday',
          'thứ 3': 'tuesday',
          'thứ 4': 'wednesday',
          'thứ 5': 'thursday',
          'thứ 6': 'friday',
          'thứ 7': 'saturday',
        };
        weekdays = weekdays.map(w => vi2en[w] || w);
        // Đảm bảo startDate/endDate là string
        const startDate = detail.startDate || '';
        const endDate = detail.endDate || '';
        // Sinh validDates cho tất cả weekday
        let allDates: string[] = [];
        if (startDate && endDate && weekdays.length > 0) {
          weekdays.forEach(weekday => {
            allDates = allDates.concat(generateValidDates(startDate, endDate, weekday));
          });
        }
        // Loại bỏ trùng lặp và sắp xếp tăng dần
        allDates = Array.from(new Set(allDates)).sort();
        setValidDates(allDates);
        // Nếu ngày đang chọn không hợp lệ thì chọn ngày đầu tiên
        if (!allDates.includes(selectedDate)) {
          setSelectedDate(allDates[0] || '');
        }
      } catch (err) {
        setValidDates([]);
      }
    };
    fetchClassDetail();
  }, [selectedClassId]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClassId) return;
      
      try {
        setLoading(true);
        const studentsData = await teacherService.getClassStudents(Number(selectedClassId));
        setStudents(studentsData);
        
        // Initialize all students as absent by default
        const initialStatus: Record<string, 'present' | 'absent' | 'late'> = {};
        studentsData.forEach((student) => {
          initialStatus[student.student_id] = 'absent';
        });
        setAttendanceStatus(initialStatus);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Không thể tải danh sách sinh viên. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceStatus((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClassId || !selectedDate) {
      setError('Vui lòng chọn lớp học và ngày điểm danh.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Submit attendance for each student
      const attendancePromises = Object.entries(attendanceStatus).map(([studentId, status]) => 
        teacherService.recordManualAttendance(
          Number(selectedClassId),
          studentId, // truyền đúng kiểu string
          selectedDate,
          status
        )
      );
      
      await Promise.all(attendancePromises);
      
      setSuccess('Điểm danh thành công!');
      
      // Redirect to attendance page after successful submission
      setTimeout(() => {
        navigate(`/teacher/classes/${selectedClassId}/attendance`);
      }, 1500);
    } catch (err) {
      console.error('Error submitting attendance:', err);
      setError('Không thể cập nhật điểm danh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-screen h-screen bg-gray-100">
      <TeacherHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                to="/teacher/dashboard" 
                className="text-blue-600 hover:text-blue-800 mr-2"
              >
                Dashboard
              </Link>
              <span className="text-gray-500">/</span>
              <span className="ml-2 text-gray-600">Điểm danh nhanh</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Điểm danh nhanh</h1>
          </div>
        </div>

        {/* Class and Date Selection */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Chọn lớp học:
                </label>
                {classLoading ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                ) : (
                  <select
                    id="class-select"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    required
                  >
                    <option value="">-- Chọn lớp học --</option>
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name} - {classItem.subject}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày điểm danh:
                </label>
                <select
                  id="date-select"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                  disabled={validDates.length === 0}
                >
                  {validDates.length === 0 && <option value="">-- Chọn lớp để hiển thị ngày --</option>}
                  {validDates.map(date => (
                    <option key={date} value={date}>{new Date(date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Students Attendance Form */}
          {selectedClassId && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Danh sách điểm danh</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Lớp: {classes.find(c => c.id.toString() === selectedClassId)?.name} | 
                  Ngày: {new Date(selectedDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700" role="alert">
                  <p>{error}</p>
                </div>
              ) : success ? (
                <div className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700" role="alert">
                  <p>{success}</p>
                </div>
              ) : students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã sinh viên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái điểm danh</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student, index) => (
                        <tr key={student.student_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-4">
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`attendance-${student.student_id}`}
                                  value="present"
                                  checked={attendanceStatus[student.student_id] === 'present'}
                                  onChange={() => handleStatusChange(student.student_id, 'present')}
                                  className="form-radio h-4 w-4 text-green-600 transition duration-150 ease-in-out"
                                />
                                <span className="ml-2 text-sm text-gray-700">Có mặt</span>
                              </label>
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`attendance-${student.student_id}`}
                                  value="late"
                                  checked={attendanceStatus[student.student_id] === 'late'}
                                  onChange={() => handleStatusChange(student.student_id, 'late')}
                                  className="form-radio h-4 w-4 text-yellow-600 transition duration-150 ease-in-out"
                                />
                                <span className="ml-2 text-sm text-gray-700">Đi muộn</span>
                              </label>
                              <label className="inline-flex items-center">
                                <input
                                  type="radio"
                                  name={`attendance-${student.student_id}`}
                                  value="absent"
                                  checked={attendanceStatus[student.student_id] === 'absent'}
                                  onChange={() => handleStatusChange(student.student_id, 'absent')}
                                  className="form-radio h-4 w-4 text-red-600 transition duration-150 ease-in-out"
                                />
                                <span className="ml-2 text-sm text-gray-700">Vắng mặt</span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Không có sinh viên nào trong lớp này.</p>
                </div>
              )}

              {students.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Lưu điểm danh'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TeacherQuickAttendance;