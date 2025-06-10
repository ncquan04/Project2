import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassAttendance, ClassDetailInfo, AttendanceStatistics, WeekAttendance } from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="container mx-auto px-4 py-6">
      {/* Nút quay lại */}
      <button 
        onClick={handleBackClick}
        className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        Quay lại danh sách lớp học
      </button>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : classInfo && statistics ? (
        <div>
          {/* Thông tin lớp học */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {classInfo.course_name} 
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({classInfo.class_code})
              </span>
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Mã môn học:</span> {classInfo.course_code}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Giảng viên:</span> {classInfo.teacher_name}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Phòng học:</span> {classInfo.room}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Lịch học:</span> {classInfo.schedule_day_vi} ({classInfo.formatted_time})
                </p>
              </div>
              
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Học kỳ:</span> {classInfo.semester}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Ngày bắt đầu:</span> {formatDate(classInfo.start_date)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Ngày kết thúc:</span> {formatDate(classInfo.end_date)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Thống kê điểm danh */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Thống kê điểm danh</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Tổng số buổi học</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.total_sessions}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Có mặt</p>
                <p className="text-2xl font-bold text-green-600">{statistics.attended_sessions}</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Vắng mặt</p>
                <p className="text-2xl font-bold text-red-600">{getAbsentCount()}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Tỷ lệ điểm danh</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.attendance_rate}%</p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">Không tìm thấy thông tin lớp học.</p>
        </div>
      )}
    </div>
  );
};

export default StudentClassAttendancePage;