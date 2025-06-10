import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassAttendance, ClassDetailInfo, AttendanceStatistics, WeekAttendance } from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

interface RouteParams {
  classId: string;
  [key: string]: string;
}

const StudentClassAttendancePage: React.FC = () => {
  const { classId } = useParams<RouteParams>();
  const navigate = useNavigate();
  // Lấy thông tin user từ context authentication
  const { user } = useAuth();
  
  const [classInfo, setClassInfo] = useState<ClassDetailInfo | null>(null);
  const [statistics, setStatistics] = useState<AttendanceStatistics | null>(null);
  const [attendance, setAttendance] = useState<WeekAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) {
      setError('ID lớp học không hợp lệ');
      return;
    }

    if (!user || !user.student_id) {
      setError('Không thể xác định thông tin sinh viên. Vui lòng đăng nhập lại.');
      return;
    }

    fetchClassAttendance(classId, user.student_id);
  }, [classId, user]);

  const fetchClassAttendance = async (id: string, studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClassAttendance(id, studentId);
      setClassInfo(data.classInfo);
      setStatistics(data.statistics);
      setAttendance(data.attendance);
    } catch (err) {
      setError('Không thể tải thông tin điểm danh. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Hàm định dạng ngày giờ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Hàm lấy màu dựa trên trạng thái điểm danh
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Hàm lấy tên trạng thái
  const getStatusName = (status: string | undefined) => {
    switch (status) {
      case 'present':
        return 'Có mặt';
      case 'absent':
        return 'Vắng mặt';
      case 'late':
        return 'Đi muộn';
      default:
        return 'Chưa điểm danh';
    }
  };

  // Nút quay lại trang danh sách lớp học
  const handleBackClick = () => {
    navigate('/student/classes');
  };

  // Tính toán số buổi vắng từ statistics
  const getAbsentCount = () => {
    if (!statistics) return 0;
    return statistics.total_sessions - statistics.attended_sessions;
  };
  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button 
                onClick={() => navigate('/student')}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Trang chủ
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <button 
                  onClick={handleBackClick}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                >
                  Lớp học
                </button>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Điểm danh</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết điểm danh lớp học</h1>
          <p className="text-gray-600 mt-2">Xem thông tin chi tiết về điểm danh và thống kê của lớp học</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        ) : classInfo && statistics ? (        <div>
          {/* Thông tin lớp học */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {classInfo.course_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    {classInfo.class_code}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                    Mã môn: {classInfo.course_code}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thông tin giảng dạy</h3>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span className="font-medium">Giảng viên:</span>
                    <span className="ml-1">{classInfo.teacher_name}</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span className="font-medium">Phòng học:</span>
                    <span className="ml-1">{classInfo.room}</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Lịch học</h3>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span className="font-medium">Thời gian:</span>
                    <span className="ml-1">{classInfo.schedule_day_vi} ({classInfo.formatted_time})</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="font-medium">Học kỳ:</span>
                    <span className="ml-1">{classInfo.semester}</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Thời gian</h3>
                <div className="space-y-2">
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span className="font-medium">Bắt đầu:</span>
                    <span className="ml-1">{formatDate(classInfo.start_date)}</span>
                  </p>
                  <p className="flex items-center text-gray-700">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span className="font-medium">Kết thúc:</span>
                    <span className="ml-1">{formatDate(classInfo.end_date)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Chi tiết điểm danh */}
          {attendance.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-800">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                Chi tiết điểm danh theo tuần
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attendance.map((week, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        Tuần {week.week_number}
                      </h3>
                      <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full font-medium">
                        {week.year_week}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">Ngày học trong tuần</h4>
                      <div className="grid gap-2">
                        {week.dates.map((classDate, dateIndex) => (
                          <div key={dateIndex} className="bg-white rounded-lg p-3 border border-gray-100 hover:border-blue-200 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                {formatDate(classDate.date)}
                              </span>                              
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(classDate.attendance?.status)}`}>
                                {getStatusName(classDate.attendance?.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy dữ liệu</h3>
            <p className="text-gray-500">Không tìm thấy thông tin lớp học hoặc dữ liệu điểm danh.</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default StudentClassAttendancePage;