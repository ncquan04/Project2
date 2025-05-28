import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API_URL } from '../services/authService';
import * as XLSX from 'xlsx';

interface Student {
  student_id: string;
  full_name: string;
  class: string;
  rfid_uid: string;
}

interface NewStudent {
  student_id: string;
  full_name: string;
  class: string;
  rfid_uid: string;
}

const AdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');  const [newStudent, setNewStudent] = useState<NewStudent>({
    student_id: '',
    full_name: '',
    class: '',
    rfid_uid: ''
  });  const [importPreview, setImportPreview] = useState<NewStudent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadStudents = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/students.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStudents(data.students);
        else setError('Không thể tải danh sách sinh viên');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  };

  const handleAddManualStudent = async () => {
    if (!newStudent.student_id || !newStudent.full_name || !newStudent.class) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/admin/students.php?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStudent)
      });      const data = await response.json();
      console.log('Add student response:', data);
      console.log('Response status:', response.status);
      
      if (data.success) {
        alert('Thêm sinh viên thành công!');
        setNewStudent({ student_id: '', full_name: '', class: '', rfid_uid: '' });
        setShowAddModal(false);
        loadStudents();
      } else {
        console.error('Add student error:', data);
        alert(data.message || data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Lỗi kết nối server');    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, fullName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sinh viên "${fullName}" (${studentId})?`)) {
      return;
    }

    setDeleting(studentId);
    try {
      const response = await fetch(`${API_URL}/admin/students.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ student_id: studentId })
      });

      const data = await response.json();
      console.log('Delete student response:', data);
      console.log('Response status:', response.status);
      
      if (data.success) {
        alert('Xóa sinh viên thành công!');
        loadStudents();
      } else {
        console.error('Delete student error:', data);
        alert(data.message || data.error || 'Có lỗi xảy ra khi xóa sinh viên');
      }
    } catch (error) {
      console.error('Delete student error:', error);
      alert('Lỗi kết nối server');
    } finally {
      setDeleting(null);
    }
  };

  const parseCSV = (text: string): NewStudent[] => {
    const lines = text.trim().split('\n');
    const data: NewStudent[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 3) {
        data.push({
          student_id: values[0] || '',
          full_name: values[1] || '',
          class: values[2] || '',
          rfid_uid: values[3] || ''
        });
      }
    }
    return data;
  };

  const parseExcel = (file: File): Promise<NewStudent[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const students: NewStudent[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length >= 3) {
              students.push({
                student_id: row[0]?.toString() || '',
                full_name: row[1]?.toString() || '',
                class: row[2]?.toString() || '',
                rfid_uid: row[3]?.toString() || ''
              });
            }
          }
          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Không thể đọc file'));
      reader.readAsArrayBuffer(file);
    });
  };
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      let preview: NewStudent[] = [];
      
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          preview = parseCSV(text);
          setImportPreview(preview);
        };
        reader.readAsText(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        preview = await parseExcel(file);
        setImportPreview(preview);
      } else {
        alert('Chỉ hỗ trợ file CSV và Excel (.xlsx, .xls)');
      }
    } catch (error) {
      alert('Lỗi khi đọc file. Vui lòng kiểm tra định dạng file.');
    }
  };

  const handleBulkImport = async () => {
    if (importPreview.length === 0) {
      alert('Không có dữ liệu để import');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/admin/bulk_add_students.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ students: importPreview })
      });      const data = await response.json();
      console.log('Bulk import response:', data);
      console.log('Response status:', response.status);
      
      if (data.success) {
        alert(`Import thành công ${data.added_count || importPreview.length} sinh viên!`);
        setImportPreview([]);
        setShowAddModal(false);
        loadStudents();
      } else {
        console.error('Bulk import error:', data);
        alert(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);
  return (
    <div className="w-screen min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Quản lý sinh viên</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            ➕ Thêm học sinh
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded shadow bg-white">            <table className="min-w-full text-sm text-gray-900">
              <thead className="bg-blue-100 text-gray-900">
                <tr>
                  <th className="py-2 px-4">Mã SV</th>
                  <th className="py-2 px-4">Họ tên</th>
                  <th className="py-2 px-4">Lớp</th>
                  <th className="py-2 px-4">RFID UID</th>
                  <th className="py-2 px-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {students.map(sv => (
                  <tr key={sv.student_id} className="border-b hover:bg-blue-50">
                    <td className="py-2 px-4">{sv.student_id}</td>
                    <td className="py-2 px-4">{sv.full_name}</td>
                    <td className="py-2 px-4">{sv.class}</td>
                    <td className="py-2 px-4">{sv.rfid_uid}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => handleDeleteStudent(sv.student_id, sv.full_name)}
                        disabled={deleting === sv.student_id}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === sv.student_id ? 'Đang xóa...' : '🗑️ Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal thêm học sinh */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-blue-700">Thêm học sinh</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b mb-6">
                  <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'manual'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Thêm thủ công
                  </button>
                  <button
                    onClick={() => setActiveTab('import')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'import'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Import từ file
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'manual' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mã sinh viên *</label>
                      <input
                        type="text"
                        value={newStudent.student_id}
                        onChange={(e) => setNewStudent({...newStudent, student_id: e.target.value})}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập mã sinh viên"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                      <input
                        type="text"
                        value={newStudent.full_name}
                        onChange={(e) => setNewStudent({...newStudent, full_name: e.target.value})}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập họ và tên"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Lớp *</label>
                      <input
                        type="text"
                        value={newStudent.class}
                        onChange={(e) => setNewStudent({...newStudent, class: e.target.value})}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập lớp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">RFID UID</label>
                      <input
                        type="text"
                        value={newStudent.rfid_uid}
                        onChange={(e) => setNewStudent({...newStudent, rfid_uid: e.target.value})}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nhập RFID UID (không bắt buộc)"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleAddManualStudent}
                        disabled={submitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Đang thêm...' : 'Thêm sinh viên'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">                    <div>
                      <label className="block text-sm font-medium mb-2">Chọn file CSV/Excel</label>
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileUpload}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm text-gray-600">
                          Định dạng: Mã SV, Họ tên, Lớp, RFID UID (tùy chọn)
                        </p>
                        <a
                          href="/sample_students.csv"
                          download
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          Tải file mẫu
                        </a>
                      </div>
                    </div>

                    {/* Preview */}
                    {importPreview.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Xem trước dữ liệu ({importPreview.length} sinh viên):</h3>
                        <div className="max-h-64 overflow-y-auto border rounded">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left">Mã SV</th>
                                <th className="px-3 py-2 text-left">Họ tên</th>
                                <th className="px-3 py-2 text-left">Lớp</th>
                                <th className="px-3 py-2 text-left">RFID UID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importPreview.slice(0, 10).map((student, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="px-3 py-2">{student.student_id}</td>
                                  <td className="px-3 py-2">{student.full_name}</td>
                                  <td className="px-3 py-2">{student.class}</td>
                                  <td className="px-3 py-2">{student.rfid_uid}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {importPreview.length > 10 && (
                            <p className="text-center text-gray-500 py-2">
                              ... và {importPreview.length - 10} sinh viên khác
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleBulkImport}
                        disabled={submitting || importPreview.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {submitting ? 'Đang import...' : `Import ${importPreview.length} sinh viên`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;
