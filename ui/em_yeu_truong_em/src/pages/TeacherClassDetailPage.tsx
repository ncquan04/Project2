import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import teacherService, { ClassInfo, Student, AttendanceRecord } from '../services/teacherService';
import Header from '../components/Header';
import ClassInfoCard from '../components/ClassInfoCard';

const TeacherClassDetailPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attendance statistics
  const [attendanceStats, setAttendanceStats] = useState<{
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  }>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    rate: 0
  });

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId) return;
      
      try {
        setLoading(true);
        
        const [classData, studentsData] = await Promise.all([
          teacherService.getClassSchedule(Number(classId)),
          teacherService.getClassStudents(Number(classId))
        ]);
        
        setClassInfo(classData);
        setStudents(studentsData);
        
        // In a real implementation, you would fetch recent attendance
        // For now, we'll generate mock data
        const today = new Date();
        const mockAttendance: AttendanceRecord[] = studentsData.slice(0, 10).map((student, index) => ({
          id: index + 1,
          student_id: student.student_id,
          full_name: student.full_name,
          student_class: student.student_class || '',
          rfid_uid: student.rfid_uid || '',
          date: today.toISOString().split('T')[0],
          status: Math.random() > 0.2 
            ? 'present' 
            : Math.random() > 0.5 ? 'late' : 'absent',
          time: `${Math.floor(Math.random() * 2) + 7}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
        }));
        
        setRecentAttendance(mockAttendance);
        
        // Calculate attendance statistics
        const presentCount = mockAttendance.filter(record => record.status === 'present').length;
        const lateCount = mockAttendance.filter(record => record.status === 'late').length;
        const absentCount = mockAttendance.filter(record => record.status === 'absent').length;
        
        setAttendanceStats({
          total: mockAttendance.length,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          rate: Math.round(((presentCount + lateCount) / mockAttendance.length) * 100)
        });
        
      } catch (err) {
        setError('Không thể tải thông tin lớp học. Vui lòng thử lại sau.');
        console.error('Error fetching class data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [classId]);

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
              <span className="ml-2 text-gray-600">{classInfo?.name}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Chi tiết lớp học</h1>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Link
              to={`/teacher/classes/${classId}/students`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Danh sách sinh viên
            </Link>
            <Link
              to={`/teacher/classes/${classId}/attendance`}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Điểm danh
            </Link>
            <Link
              to={`/teacher/classes/${classId}/schedule`}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lịch học
            </Link>
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
          <>
            <ClassInfoCard classInfo={classInfo} />
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Sinh viên</h3>
                    <p className="text-2xl font-bold text-blue-600">{students.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Tỷ lệ điểm danh</h3>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats.rate}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Đi muộn</h3>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">Vắng mặt</h3>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Attendance */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Điểm danh gần đây</h2>
                <Link 
                  to={`/teacher/classes/${classId}/attendance`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Xem tất cả
                </Link>
              </div>
              
              {recentAttendance.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã sinh viên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ điểm danh</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.student_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.full_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === 'present' 
                                  ? 'bg-green-100 text-green-800' 
                                  : record.status === 'late'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {record.status === 'present' ? 'Có mặt' : record.status === 'late' ? 'Đi muộn' : 'Vắng mặt'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.time || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6 text-center">
                  <p className="text-gray-500">Chưa có dữ liệu điểm danh cho lớp này.</p>
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Thao tác nhanh</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <Link
                  to={`/teacher/classes/${classId}/schedule`}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center shadow-sm"
                >
                  <div className="bg-purple-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="ml-3 font-medium">Thay đổi lịch học</span>
                </Link>
                
                <button
                  onClick={() => {
                    window.open(`/teacher/export-attendance/${classId}`, '_blank');
                  }}
                  className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center shadow-sm"
                >
                  <div className="bg-green-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <span className="ml-3 font-medium">Xuất báo cáo</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherClassDetailPage;
