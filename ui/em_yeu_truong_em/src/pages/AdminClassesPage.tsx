import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API_URL } from '../services/authService';

interface Class {
  class_id: string;
  class_name: string;
  room: string;
  course_id: string;
  start_time: string;
  schedule_day: string; // Thêm trường ngày học
}

const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/admin/classes.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setClasses(data.classes);
        else setError('Không thể tải danh sách lớp học');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  const weekdayMap: Record<string, string> = {
    monday: 'Thứ Hai',
    tuesday: 'Thứ Ba',
    wednesday: 'Thứ Tư',
    thursday: 'Thứ Năm',
    friday: 'Thứ Sáu',
    saturday: 'Thứ Bảy',
    sunday: 'Chủ Nhật',
  };

  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Quản lý lớp học</h1>
        {loading ? <div>Đang tải...</div> : error ? <div className="text-red-500">{error}</div> : (
          <div className="overflow-x-auto rounded shadow bg-white">
            <table className="min-w-full text-sm text-gray-800">
              <thead className="bg-blue-100 text-blue-900">
                <tr>
                  <th className="py-2 px-4">Mã lớp</th>
                  <th className="py-2 px-4">Tên lớp</th>
                  <th className="py-2 px-4">Phòng</th>
                  <th className="py-2 px-4">Mã môn</th>
                  <th className="py-2 px-4">Ngày học</th>
                  <th className="py-2 px-4">Giờ bắt đầu</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.class_id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{cls.class_id}</td>
                    <td className="py-2 px-4">{cls.class_name}</td>
                    <td className="py-2 px-4">{cls.room}</td>
                    <td className="py-2 px-4">{cls.course_id}</td>
                    <td className="py-2 px-4">{weekdayMap[cls.schedule_day] || cls.schedule_day}</td>
                    <td className="py-2 px-4">{cls.start_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClassesPage;
