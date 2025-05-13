import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import teacherService, { ClassInfo } from '../services/teacherService';
import Header from '../components/Header';

const TeacherClassesPage = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getTeacherClasses();
        setClasses(data);
      } catch (err) {
        setError('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return (
    <div className="w-screen h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Danh sách lớp giảng dạy</h1>
          <Link to="/teacher/dashboard" className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg">
            Quay lại
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        ) : classes.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã lớp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên lớp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Môn học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lịch học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng học</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {classes.map((classItem) => (
                    <tr key={classItem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{classItem.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.schedule}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{classItem.room}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/teacher/classes/${classItem.id}/students`} className="text-blue-600 hover:text-blue-900 mr-4">
                          Sinh viên
                        </Link>
                        <Link to={`/teacher/classes/${classItem.id}/attendance`} className="text-green-600 hover:text-green-900 mr-4">
                          Điểm danh
                        </Link>
                        <Link to={`/teacher/classes/${classItem.id}/schedule`} className="text-purple-600 hover:text-purple-900">
                          Lịch học
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-gray-600 text-lg mb-4">Bạn chưa được phân công lớp nào.</p>
            <p className="text-gray-500">Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherClassesPage;