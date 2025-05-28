import React, { useEffect, useState } from 'react';
import Header from '../components/Header';

interface Schedule {
  schedule_id: string;
  class_id: string;
  room_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

const AdminSchedulesPage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost/server_diem_danh/api/admin/schedules.php?action=list', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setSchedules(data.schedules);
        else setError('Không thể tải danh sách lịch học');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Quản lý lịch học</h1>
        {loading ? <div>Đang tải...</div> : error ? <div className="text-red-500">{error}</div> : (
          <div className="overflow-x-auto rounded shadow bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="py-2 px-4">Mã lịch</th>
                  <th className="py-2 px-4">Mã lớp</th>
                  <th className="py-2 px-4">Mã phòng</th>
                  <th className="py-2 px-4">Ngày</th>
                  <th className="py-2 px-4">Bắt đầu</th>
                  <th className="py-2 px-4">Kết thúc</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(sch => (
                  <tr key={sch.schedule_id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{sch.schedule_id}</td>
                    <td className="py-2 px-4">{sch.class_id}</td>
                    <td className="py-2 px-4">{sch.room_id}</td>
                    <td className="py-2 px-4">{sch.date}</td>
                    <td className="py-2 px-4">{sch.start_time}</td>
                    <td className="py-2 px-4">{sch.end_time}</td>
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

export default AdminSchedulesPage;
