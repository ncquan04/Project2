import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import teacherService, { ClassInfo } from '../services/teacherService';
import TeacherHeader from '../components/TeacherHeader';

const TeacherDashboard = () => {
    const [classes, setClasses] = useState<ClassInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                setLoading(true);
                const data = await teacherService.getTeacherClasses();
                // Map lại dữ liệu cho đúng interface ClassInfo
                const mapped = data.map((item: any) => ({
                    id: item.class_id ?? item.id,
                    name: item.class_code ?? item.name,
                    subject: item.course_name ?? item.subject,
                    schedule: item.schedule_day && item.start_time && item.end_time
                        ? `${item.schedule_day} (${item.start_time} - ${item.end_time})`
                        : item.schedule,
                    room: item.room,
                }));
                setClasses(mapped);
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
            <TeacherHeader />
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-blue-900 mb-8">Bảng điều khiển giảng viên</h1>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        <p className="text-red-800">{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Quick access cards */}
                        <Link
                            to="/teacher/classes"
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-blue-900">Lớp giảng dạy</h2>
                                    <p className="text-gray-700 mt-2">Quản lý các lớp bạn đang giảng dạy</p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-lg font-bold text-blue-700">{classes.length} lớp</span>
                            </div>
                        </Link>

                        <Link
                            to="/teacher/attendance"
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-green-900">Điểm danh</h2>
                                    <p className="text-green-800 mt-2">Quản lý điểm danh cho các buổi học</p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-lg font-bold text-green-700">Quản lý điểm danh</span>
                            </div>
                        </Link>

                        <Link
                            to="/teacher/schedule"
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-purple-900">Lịch dạy</h2>
                                    <p className="text-purple-800 mt-2">Quản lý và thay đổi lịch giảng dạy</p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-lg font-bold text-purple-700">Xem lịch dạy</span>
                            </div>
                        </Link>

                        <Link
                            to="/teacher/quick-attendance"
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-yellow-900">Điểm danh nhanh</h2>
                                    <p className="text-yellow-800 mt-2">Điểm danh thủ công theo buổi học</p>
                                </div>
                                <div className="bg-yellow-100 p-3 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-lg font-bold text-yellow-700">Điểm danh nhanh</span>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Các lớp gần đây */}
                <h2 className="text-2xl font-bold text-blue-900 mt-10 mb-6">Lớp học gần đây</h2>
                {loading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : classes.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Mã lớp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Tên lớp</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Môn học</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Lịch học</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Phòng học</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classes.slice(0, 5).map((classItem) => (
                                    <tr key={classItem.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">#{classItem.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{classItem.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{classItem.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{classItem.schedule}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-800">{classItem.room}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link to={`/teacher/classes/${classItem.id}/students`} className="text-blue-600 hover:text-blue-900 mr-4">
                                                Sinh viên
                                            </Link>
                                            <Link to={`/teacher/classes/${classItem.id}/attendance`} className="text-green-600 hover:text-green-900">
                                                Điểm danh
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {classes.length > 5 && (
                            <div className="bg-gray-50 px-4 py-3 flex justify-center">
                                <Link to="/teacher/classes" className="text-blue-600 hover:text-blue-900 font-medium">
                                    Xem tất cả lớp học
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <p className="text-blue-800">Bạn chưa được phân công lớp nào.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;