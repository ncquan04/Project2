import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import teacherService, { ClassInfo } from '../services/teacherService';
import Header from '../components/Header';

const TeacherAttendancePage = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [attendanceStats, setAttendanceStats] = useState<Record<number, { 
    total: number;
    present: number;
    absent: number;
    late: number;
  }>>({});

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getTeacherClasses();
        setClasses(data);

        // In a real implementation, you would fetch attendance statistics for each class
        // For now, we'll generate mock data
        const mockStats: Record<number, any> = {};
        data.forEach(classItem => {
          mockStats[classItem.id] = {
            total: Math.floor(Math.random() * 30) + 20, // Random number of students between 20-50
            present: 0,
            absent: 0,
            late: 0
          };
          
          mockStats[classItem.id].present = Math.floor(Math.random() * mockStats[classItem.id].total * 0.8);
          mockStats[classItem.id].late = Math.floor(Math.random() * (mockStats[classItem.id].total - mockStats[classItem.id].present) * 0.5);
          mockStats[classItem.id].absent = mockStats[classItem.id].total - mockStats[classItem.id].present - mockStats[classItem.id].late;
        });
        
        setAttendanceStats(mockStats);
      } catch (err) {
        setError('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
        console.error('Error fetching classes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(classItem => 
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classItem.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStatusColor = (classId: number) => {
    if (!attendanceStats[classId]) return 'bg-gray-100';
    
    const stats = attendanceStats[classId];
    const presentRate = (stats.present / stats.total) * 100;
    
    if (presentRate >= 90) return 'bg-green-100';
    if (presentRate >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getAttendanceRate = (classId: number) => {
    if (!attendanceStats[classId]) return '0%';
    
    const stats = attendanceStats[classId];
    return `${Math.round((stats.present / stats.total) * 100)}%`;
  };

  return (
    <div className="w-screen h-screen bg-gray-100">
      <Header />
      
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
              <span className="ml-2 text-gray-600">Điểm danh</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý điểm danh</h1>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Link
              to="/teacher/quick-attendance"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Điểm danh nhanh
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="w-full md:w-1/3">
              <label htmlFor="search" className="sr-only">Tìm kiếm</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Tìm kiếm lớp học"
                />
              </div>
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
        ) : filteredClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">{classItem.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getAttendanceStatusColor(classItem.id)}`}>
                      {getAttendanceRate(classItem.id)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{classItem.subject}</p>
                </div>
                
                <div className="px-6 py-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-blue-600">
                        {attendanceStats[classItem.id]?.total || 0}
                      </span>
                      <span className="text-xs text-gray-500">Tổng số SV</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-green-600">
                        {attendanceStats[classItem.id]?.present || 0}
                      </span>
                      <span className="text-xs text-gray-500">Có mặt</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-2xl font-bold text-red-600">
                        {attendanceStats[classItem.id]?.absent || 0}
                      </span>
                      <span className="text-xs text-gray-500">Vắng mặt</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ 
                        width: attendanceStats[classItem.id] 
                          ? `${(attendanceStats[classItem.id].present / attendanceStats[classItem.id].total) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Link
                      to={`/teacher/classes/${classItem.id}/attendance`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Xem chi tiết
                    </Link>
                    <Link
                      to={`/teacher/quick-attendance?classId=${classItem.id}`}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Điểm danh
                    </Link>
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-gray-50">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Lịch học: {classItem.schedule}</span>
                    <span>Phòng: {classItem.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600 text-lg mb-4">Không tìm thấy lớp học nào</p>
            <p className="text-gray-500">Hãy thử tìm kiếm với từ khóa khác hoặc liên hệ quản trị viên</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendancePage;
