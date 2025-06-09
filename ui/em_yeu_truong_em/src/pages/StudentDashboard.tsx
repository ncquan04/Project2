import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getActiveClasses, ClassInfo } from '../services/studentService';
import Header from '../components/Header';

// Student ID cố định cho demo - trong thực tế có thể lấy từ localStorage hoặc truyền qua props
const DEMO_STUDENT_ID = 'SV001';

const StudentDashboard: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveClasses();
  }, []);

  const fetchActiveClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActiveClasses(DEMO_STUDENT_ID);
      setClasses(data);
    } catch (err) {
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Nhóm các lớp học theo ngày trong tuần để dễ hiển thị
  const groupedByDay: Record<string, ClassInfo[]> = {};
  
  // Thứ tự các ngày trong tuần (tiếng Việt)
  const dayOrder = {
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
    'sunday': 7
  };

  // Nhóm các lớp học theo ngày trong tuần
  classes.forEach(classInfo => {
    if (!groupedByDay[classInfo.schedule_day]) {
      groupedByDay[classInfo.schedule_day] = [];
    }
    groupedByDay[classInfo.schedule_day].push(classInfo);
  });

  // Sắp xếp mảng ngày trong tuần theo thứ tự
  const sortedDays = Object.keys(groupedByDay).sort((a, b) => dayOrder[a as keyof typeof dayOrder] - dayOrder[b as keyof typeof dayOrder]);  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Bảng điều khiển sinh viên</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-blue-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Truy cập nhanh
            </h2>
            <div className="space-y-2">
              <Link to="/student/classes" className="flex items-center p-3 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition duration-150">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                Tất cả lớp học
              </Link>
              <Link to="/student/attendance-history" className="flex items-center p-3 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition duration-150">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                Lịch sử điểm danh
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-green-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Thống kê
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">Lớp học</p>
                <p className="text-xl font-bold text-blue-600">{classes.length}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-gray-600">Học kỳ</p>
                <p className="text-xl font-bold text-green-600">Hiện tại</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-purple-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              Thông báo
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-700">Sắp tới kỳ thi cuối kỳ. Vui lòng kiểm tra lịch thi tại văn phòng khoa.</p>
                <p className="text-xs text-gray-500 mt-1">2 giờ trước</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">Nhà trường thông báo nghỉ lễ ngày 30/04 và 01/05.</p>
                <p className="text-xs text-gray-500 mt-1">1 ngày trước</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lịch học trong tuần</h2>
          
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : classes.length === 0 ? (
            <p className="text-center text-gray-500 py-6">Không có lớp học nào trong học kỳ hiện tại.</p>
          ) : (
            <div>
              {sortedDays.map(day => {
                const dayClasses = groupedByDay[day];
                const dayName = {
                  'monday': 'Thứ Hai',
                  'tuesday': 'Thứ Ba',
                  'wednesday': 'Thứ Tư',
                  'thursday': 'Thứ Năm',
                  'friday': 'Thứ Sáu',
                  'saturday': 'Thứ Bảy',
                  'sunday': 'Chủ Nhật'
                }[day] || day;
                
                return (
                  <div key={day} className="mb-6 last:mb-0">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">{dayName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayClasses.map(classInfo => (
                        <Link 
                          to={`/student/class-attendance/${classInfo.class_id}`}
                          key={classInfo.class_id} 
                          className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-blue-800">{classInfo.course_name}</h4>
                            <span className="text-xs bg-white px-2 py-1 rounded text-gray-600">{classInfo.formatted_time}</span>
                          </div>
                          <p className="text-sm text-gray-600">Mã lớp: {classInfo.class_code}</p>
                          <p className="text-sm text-gray-600">Phòng: {classInfo.room}</p>
                          <p className="text-sm text-gray-600">Giảng viên: {classInfo.teacher_name}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;