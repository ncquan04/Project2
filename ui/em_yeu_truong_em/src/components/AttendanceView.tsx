import { useState } from 'react';
import { AttendanceRecord } from '../services/teacherService';

interface AttendanceViewProps {
  attendance: AttendanceRecord[];
  onUpdateAttendance?: (recordId: number, status: 'present' | 'absent' | 'late') => Promise<void>;
  date: string;
  isEditable?: boolean;
}

const AttendanceView = ({ 
  attendance, 
  onUpdateAttendance,
  date,
  isEditable = true
}: AttendanceViewProps) => {
  const [editingRecord, setEditingRecord] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<'present' | 'absent' | 'late'>('present');
  const [loading, setLoading] = useState<boolean>(false);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Có mặt';
      case 'absent':
        return 'Vắng mặt';
      case 'late':
        return 'Đi muộn';
      default:
        return 'Không xác định';
    }
  };

  const handleSaveStatus = async (recordId: number) => {
    if (!onUpdateAttendance) return;
    
    setLoading(true);
    try {
      await onUpdateAttendance(recordId, editStatus);
      setEditingRecord(null);
    } catch (err) {
      console.error('Error updating attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  if (attendance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-600 text-lg mb-4">Không có dữ liệu điểm danh cho ngày {new Date(date).toLocaleDateString('vi-VN')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          Danh sách điểm danh ngày {new Date(date).toLocaleDateString('vi-VN')}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã sinh viên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và tên</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giờ điểm danh</th>
              {isEditable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendance.map((record, index) => {
              const recordId = record.id ?? index;
              const status: 'present' | 'absent' | 'late' = (record.status ?? record.attendance?.status ?? 'absent') as 'present' | 'absent' | 'late';
              return (
                <tr key={recordId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.student_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingRecord === recordId ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'present' | 'absent' | 'late')}
                        className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="present">Có mặt</option>
                        <option value="absent">Vắng mặt</option>
                        <option value="late">Đi muộn</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(status)}`}>
                        {getStatusText(status)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.time ?? (record.attendance?.check_in_time ? new Date(record.attendance.check_in_time).toLocaleTimeString('vi-VN') : '-')}
                  </td>
                  {isEditable && onUpdateAttendance && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingRecord === recordId ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveStatus(recordId)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {loading ? 'Đang lưu...' : 'Lưu'}
                          </button>
                          <button
                            onClick={() => setEditingRecord(null)}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingRecord(recordId);
                            setEditStatus(status);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Chỉnh sửa
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceView;
