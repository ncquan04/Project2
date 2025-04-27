import React, { useEffect, useState } from 'react';
import { ClassInfo, getAllClasses, getActiveClasses } from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';

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
  }, {} as Record<string, ClassInfo[]>);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Danh sách lớp học</h1>
      
      {/* Tab navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`py-2 px-4 ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('active')}
        >
          Lớp học học kỳ hiện tại
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả lớp học
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">Không tìm thấy lớp học nào.</p>
        </div>
      ) : (
        <div>
          {activeTab === 'all' ? (
            // Hiển thị tất cả lớp học được nhóm theo học kỳ
            Object.keys(groupedClasses).sort().reverse().map(semester => (
              <div key={semester} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{semester}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedClasses[semester].map(classInfo => (
                    <ClassCard key={classInfo.class_id} classInfo={classInfo} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Hiển thị lớp học học kỳ hiện tại
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map(classInfo => (
                <ClassCard key={classInfo.class_id} classInfo={classInfo} />
              ))}
            </div>
          )}
        </div>
      )}
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