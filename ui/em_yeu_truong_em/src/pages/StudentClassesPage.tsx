import React, { useEffect, useState } from 'react';
import { ClassInfo, getAllClasses, getActiveClasses } from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';

const StudentClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active'>('active');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
    // Lấy thông tin user từ context authentication
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.student_id) {
      fetchClasses(activeTab, user.student_id);
    } else {
      setError('Không thể xác định thông tin sinh viên. Vui lòng đăng nhập lại.');
    }
  }, [activeTab, user]);

  const fetchClasses = async (tab: 'all' | 'active', studentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = tab === 'all' 
        ? await getAllClasses(studentId) 
        : await getActiveClasses(studentId);
      setClasses(data);
    } catch (err) {
      setError('Không thể tải danh sách lớp học. Vui lòng thử lại sau.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Nhóm các lớp học theo học kỳ
  const groupedClasses = classes.reduce((acc, classInfo) => {
    if (!acc[classInfo.semester]) {
      acc[classInfo.semester] = [];
    }
    acc[classInfo.semester].push(classInfo);
    return acc;
  }, {} as Record<string, ClassInfo[]>);  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <a href="/" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                Trang chủ
              </a>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">Các lớp học</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Các lớp học của tôi</h1>
          <p className="text-gray-600">Quản lý và theo dõi các lớp học bạn đã tham gia</p>
        </div>

        {/* Tab navigation */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'active' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('active')}
            >
              Lớp học học kỳ hiện tại
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'all' ? 'bg-blue-700 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              onClick={() => setActiveTab('all')}
            >
              Tất cả lớp học
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lớp học nào</h3>
            <p className="text-gray-500">
              {activeTab === 'active' ? 'Bạn chưa tham gia lớp học nào đang hoạt động.' : 'Bạn chưa tham gia lớp học nào.'}
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'all' ? (
              // Hiển thị tất cả lớp học được nhóm theo học kỳ
              Object.keys(groupedClasses).sort().reverse().map(semester => (
                <div key={semester} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{semester}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupedClasses[semester].map(classInfo => (
                      <ClassCard key={classInfo.class_id} classInfo={classInfo} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Hiển thị lớp học học kỳ hiện tại
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(classInfo => (
                  <ClassCard key={classInfo.class_id} classInfo={classInfo} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Component ClassCard để hiển thị thẻ lớp học
const ClassCard: React.FC<{classInfo: ClassInfo}> = ({classInfo}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium text-blue-700">{classInfo.course_name}</h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {classInfo.course_code}
        </span>
      </div>
      
      <div className="mb-3 text-sm">
        <p className="text-gray-600">
          <span className="font-semibold">Mã lớp:</span> {classInfo.class_code}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Giảng viên:</span> {classInfo.teacher_name}
        </p>
        <p className="text-gray-600">
          <span className="font-semibold">Tín chỉ:</span> {classInfo.credits}
        </p>
      </div>
      
      <div className="border-t border-gray-200 pt-2 mt-2">
        <p className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          {classInfo.schedule_day_vi} ({classInfo.formatted_time})
        </p>
        
        <p className="flex items-center text-sm text-gray-600 mt-1">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Phòng: {classInfo.room}
        </p>
      </div>
      
      <button
        className="mt-3 w-full bg-blue-50 text-blue-700 py-1 px-3 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
        onClick={() => window.location.href = `/student/class-attendance/${classInfo.class_id}`}
      >
        Xem điểm danh
      </button>
    </div>
  );
};

export default StudentClassesPage;