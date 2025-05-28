import React, { useEffect, useState } from 'react';
import Header from '../components/Header';

interface Room {
  room_id: string;
  room_name: string;
  capacity: number;
}

const AdminRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost/server_diem_danh/api/admin/rooms.php?action=list', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setRooms(data.rooms);
        else setError('Không thể tải danh sách phòng học');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Quản lý phòng học</h1>
        {loading ? <div>Đang tải...</div> : error ? <div className="text-red-500">{error}</div> : (
          <div className="overflow-x-auto rounded shadow bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-100">
                <tr>
                  <th className="py-2 px-4">Mã phòng</th>
                  <th className="py-2 px-4">Tên phòng</th>
                  <th className="py-2 px-4">Sức chứa</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.room_id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{room.room_id}</td>
                    <td className="py-2 px-4">{room.room_name}</td>
                    <td className="py-2 px-4">{room.capacity}</td>
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

export default AdminRoomsPage;
