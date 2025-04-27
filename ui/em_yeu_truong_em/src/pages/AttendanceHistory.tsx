import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAttendanceHistory, AttendanceRecord } from '../services/studentService';

const AttendanceHistory: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'present', 'absent', 'late'

  // Student ID cố định cho demo
  const DEMO_STUDENT_ID = 'SV001';

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceHistory(DEMO_STUDENT_ID);
      setAttendanceRecords(data);
    } catch (err) {
      setError('Không thể tải dữ liệu điểm danh. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lọc các bản ghi theo trạng thái
  const filteredRecords = filter === 'all' 
    ? attendanceRecords 
    : attendanceRecords.filter(record => record.status === filter);

  // Nhóm các bản ghi theo ngày
  const groupedByDate: Record<string, AttendanceRecord[]> = {};
  filteredRecords.forEach(record => {
    if (!groupedByDate[record.date]) {
      groupedByDate[record.date] = [];
    }
    groupedByDate[record.date].push(record);
  });

  // Sắp xếp các ngày theo thứ tự giảm dần (mới nhất lên đầu)
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Hàm format ngày
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Hàm lấy class CSS cho từng trạng thái
  const getStatusClass = (status: string) => {
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

  // Hàm lấy text hiển thị cho từng trạng thái
  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Có mặt';
      case 'absent':
        return 'Vắng mặt';
      case 'late':
        return 'Đi trễ';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold mb-2 md:mb-0">Lịch sử điểm danh</h1>
          
          <div className="flex space-x-2">
            <select 
              className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="present">Có mặt</option>
              <option value="absent">Vắng mặt</option>
              <option value="late">Đi trễ</option>
            </select>
            
            <button 
              onClick={() => fetchAttendanceHistory()}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1 text-sm"
            >
              Làm mới
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : filteredRecords.length === 0 ? (
          <p className="text-center text-gray-500 py-6">Không có dữ liệu điểm danh phù hợp với bộ lọc.</p>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date} className="pb-4 border-b border-gray-200 last:border-0">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{formatDate(date)}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Môn học
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã lớp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thời gian
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giảng viên
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedByDate[date].map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.class_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{record.course_code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{record.time}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{record.teacher_name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(record.status)}`}>
                              {getStatusText(record.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <Link 
            to="/student" 
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Quay lại Dashboard
          </Link>
          
          {/* Phân trang có thể được thêm vào đây nếu cần */}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;