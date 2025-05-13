import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import teacherService, { Student, ClassInfo } from '../services/teacherService';
import Header from '../components/Header';

const TeacherClassStudentsPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      
      try {
        setLoading(true);
        const [studentsData, classData] = await Promise.all([
          teacherService.getClassStudents(Number(classId)),
          teacherService.getClassSchedule(Number(classId))
        ]);
        
        // Đảm bảo studentsData là một mảng
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        setClassInfo(classData);
      } catch (err) {
        setError('Không thể tải thông tin sinh viên. Vui lòng thử lại sau.');
        console.error('Error fetching class students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <h1 className="text-3xl font-bold text-gray-800">Danh sách sinh viên</h1>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Link 
              to={`/teacher/classes/${classId}/attendance`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Xem điểm danh
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
            {/* Class Info Card */}
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
                  <p className="text-sm text-gray-500">Lịch học</p>
                  <p className="font-medium text-gray-900">{classInfo?.schedule}</p>                </div>
              </div>
            </div>
            
            {/* Students Table */}
            {students && students.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Danh sách sinh viên ({students.length})</h2>
                    <button
                      onClick={() => window.print()}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      In danh sách
                    </button>                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã sinh viên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr key={student.student_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.full_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.student_class}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.rfid_uid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Đã đăng ký
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Chưa đăng ký
                            </span>
                          )}                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-gray-600 text-lg mb-4">Lớp học này chưa có sinh viên nào.</p>
                <p className="text-gray-500">Vui lòng liên hệ quản trị viên để biết thêm chi tiết.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherClassStudentsPage;
