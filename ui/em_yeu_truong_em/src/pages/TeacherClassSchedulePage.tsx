import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import teacherService, { ClassInfo, ScheduleChange } from '../services/teacherService';
import Header from '../components/Header';

const TeacherClassSchedulePage = () => {
  const { classId } = useParams<{ classId: string }>();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [formData, setFormData] = useState<{
    originalDate: string;
    newDate?: string;
    originalRoom: string;
    newRoom?: string;
    reason: string;
    status: string;
  }>({
    originalDate: new Date().toISOString().split('T')[0],
    newDate: '',
    originalRoom: '',
    newRoom: '',
    reason: '',
    status: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      try {
        setLoading(true);
        const classData = await teacherService.getClassSchedule(Number(classId));
        setClassInfo(classData);
        
        // Lấy lịch sử thay đổi thực tế từ API
        const changes = await teacherService.getScheduleChanges(Number(classId));
        setScheduleChanges(changes);
        
        setFormData(prev => ({
          ...prev,
          originalRoom: classData.room
        }));
      } catch (err) {
        setError('Không thể tải thông tin lịch học. Vui lòng thử lại sau.');
        console.error('Error fetching class schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    try {
      const scheduleChange = {
        classId: Number(classId),
        ...formData
      };
      const success = await teacherService.updateSchedule(scheduleChange);
      
      if (success) {
        alert('Thay đổi lịch học thành công!');
        
        // Lấy lại lịch sử thay đổi mới nhất từ API
        const changes = await teacherService.getScheduleChanges(Number(classId));
        setScheduleChanges(changes);
        
        // Reset form
        setFormData({
          originalDate: new Date().toISOString().split('T')[0],
          newDate: '',
          originalRoom: classInfo?.room || '',
          newRoom: '',
          reason: '',
          status: '',
        });
        
        // Hide form
        setShowChangeForm(false);
      } else {
        alert('Có lỗi xảy ra khi cập nhật lịch học.');
      }
    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Không thể cập nhật lịch học. Vui lòng thử lại sau.');
    }
  };

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
              <Link
                to={`/teacher/classes/${classId}/students`}
                className="text-blue-600 hover:text-blue-800 mx-2"
              >
                {classInfo?.name}
              </Link>
              <span className="text-gray-500">/</span>
              <span className="ml-2 text-gray-600">Lịch học</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Quản lý lịch học</h1>
          </div>
          
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setShowChangeForm(!showChangeForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg inline-flex items-center"
            >
              {showChangeForm ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Đóng biểu mẫu
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Thay đổi lịch học
                </>
              )}
            </button>
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
            {/* Class Schedule Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin lịch học hiện tại</h2>
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
                  <p className="font-medium text-gray-900">{classInfo?.schedule}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phòng học</p>
                  <p className="font-medium text-gray-900">{classInfo?.room}</p>
                </div>
              </div>
            </div>

            {/* Schedule Change Form */}
            {showChangeForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Thay đổi lịch học</h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label htmlFor="originalDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày học cần thay đổi
                      </label>
                      <input
                        type="date"
                        id="originalDate"
                        name="originalDate"
                        value={formData.originalDate}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày học mới (bỏ trống nếu không thay đổi)
                      </label>
                      <input
                        type="date"
                        id="newDate"
                        name="newDate"
                        value={formData.newDate}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="originalRoom" className="block text-sm font-medium text-gray-700 mb-1">
                        Phòng học hiện tại
                      </label>
                      <input
                        type="text"
                        id="originalRoom"
                        name="originalRoom"
                        value={formData.originalRoom}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        readOnly
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="newRoom" className="block text-sm font-medium text-gray-700 mb-1">
                        Phòng học mới (bỏ trống nếu không thay đổi)
                      </label>
                      <input
                        type="text"
                        id="newRoom"
                        name="newRoom"
                        value={formData.newRoom}
                        onChange={handleInputChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Nhập phòng học mới"
                      />
                    </div>
                  </div>
                  <div className="mb-6">
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                      Lý do thay đổi
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      rows={3}
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Nhập lý do thay đổi lịch học"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Loại thay đổi
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status || ''}
                      onChange={handleInputChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    >
                      <option value="">-- Chọn loại thay đổi --</option>
                      <option value="cancelled">Hủy buổi học</option>
                      <option value="rescheduled">Dời ngày học</option>
                      <option value="room_change">Đổi phòng</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowChangeForm(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg mr-3"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Recent Schedule Changes */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Lịch sử thay đổi</h2>
              </div>
              
              {scheduleChanges.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày thay đổi</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Từ ngày</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đến ngày</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Từ phòng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đến phòng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lý do</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scheduleChanges.map((change) => (
                      <tr key={change.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date().toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(change.originalDate).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {change.newDate 
                            ? new Date(change.newDate).toLocaleDateString('vi-VN') 
                            : <span className="text-gray-400">Không thay đổi</span>
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {change.originalRoom}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {change.newRoom || <span className="text-gray-400">Không thay đổi</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {change.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500">Chưa có thay đổi lịch học nào được ghi nhận.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherClassSchedulePage;