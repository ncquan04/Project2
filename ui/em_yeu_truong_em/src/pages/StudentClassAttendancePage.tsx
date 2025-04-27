import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassAttendance, ClassDetail, SessionInfo } from '../services/studentService';
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
  
  const [classDetails, setClassDetails] = useState<ClassDetail | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
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
      setClassDetails(data.class_details);
      setSessions(data.sessions);
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

  // Hàm định dạng giờ
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    return `${hour}:${minute}`;
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
      ) : classDetails ? (
        <div>
          {/* Thông tin lớp học */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {classDetails.class_info.course_name} 
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({classDetails.class_info.class_code})
              </span>
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Mã môn học:</span> {classDetails.class_info.course_code}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Giảng viên:</span> {classDetails.class_info.teacher_name}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Phòng học:</span> {classDetails.class_info.room}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Lịch học:</span> {classDetails.class_info.schedule_day_vi} ({classDetails.class_info.formatted_time})
                </p>
              </div>
              
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Học kỳ:</span> {classDetails.class_info.semester}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Ngày bắt đầu:</span> {formatDate(classDetails.class_info.start_date)}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Ngày kết thúc:</span> {formatDate(classDetails.class_info.end_date)}
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
                <p className="text-2xl font-bold text-blue-600">{classDetails.attendance_summary.total_sessions}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Có mặt</p>
                <p className="text-2xl font-bold text-green-600">{classDetails.attendance_summary.attended}</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Vắng mặt</p>
                <p className="text-2xl font-bold text-red-600">{classDetails.attendance_summary.absent}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-sm text-gray-600">Tỷ lệ điểm danh</p>
                <p className="text-2xl font-bold text-purple-600">{classDetails.attendance_summary.attendance_rate}%</p>
              </div>
            </div>
          </div>

          {/* Chi tiết các buổi học */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Chi tiết điểm danh</h2>
            
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Chưa có buổi học nào được ghi nhận.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Buổi học
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ghi chú
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sessions.map((session, index) => (
                      <tr key={session.session_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">Buổi {index + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(session.session_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.attendance_status)}`}>
                            {getStatusName(session.attendance_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {session.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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