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
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual'); const [newStudent, setNewStudent] = useState<NewStudent>({
    student_id: '',
    full_name: '',
    class: '',
    rfid_uid: ''
  }); const [importPreview, setImportPreview] = useState<NewStudent[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'student_id' | 'full_name' | 'class' | 'rfid_uid'>('student_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
      }); const data = await response.json();
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
      alert('Lỗi kết nối server');
    } finally {
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
      }); const data = await response.json();
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

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student =>
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rfid_uid.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy].toLowerCase();
      const bValue = b[sortBy].toLowerCase();

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleSort = (column: 'student_id' | 'full_name' | 'class' | 'rfid_uid') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
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

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm sinh viên
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã SV, họ tên, lớp, hoặc RFID UID..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sắp xếp theo
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'student_id' | 'full_name' | 'class' | 'rfid_uid')}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="student_id">Mã SV</option>
                  <option value="full_name">Họ tên</option>
                  <option value="class">Lớp</option>
                  <option value="rfid_uid">RFID UID</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Hiện tại: ${sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Hiển thị {filteredAndSortedStudents.length} / {students.length} sinh viên
            {searchTerm && (
              <span className="ml-2">
                (tìm kiếm: "{searchTerm}")
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 text-blue-600 hover:text-blue-800 underline"
                >
                  Xóa bộ lọc
                </button>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Đang tải...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : (
          <div className="overflow-x-auto rounded shadow bg-white">            <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-blue-100 text-gray-900">
              <tr>
                <th
                  className="py-2 px-4 cursor-pointer hover:bg-blue-200 transition"
                  onClick={() => handleSort('student_id')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Mã SV
                    {sortBy === 'student_id' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="py-2 px-4 cursor-pointer hover:bg-blue-200 transition"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Họ tên
                    {sortBy === 'full_name' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="py-2 px-4 cursor-pointer hover:bg-blue-200 transition"
                  onClick={() => handleSort('class')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Lớp
                    {sortBy === 'class' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="py-2 px-4 cursor-pointer hover:bg-blue-200 transition"
                  onClick={() => handleSort('rfid_uid')}
                >
                  <div className="flex items-center justify-center gap-1">
                    RFID UID
                    {sortBy === 'rfid_uid' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="py-2 px-4">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy sinh viên nào phù hợp' : 'Chưa có sinh viên nào'}
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map(sv => (
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
                ))
              )}
            </tbody>
          </table>
          </div>
        )}        {/* Modal thêm học sinh */}
        {showAddModal && (
          <div className="fixed inset-0 bg- bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">👨‍🎓</span>
                    Thêm học sinh mới
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-white hover:text-gray-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
                <div className="p-6">                {/* Tabs */}
                  <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
                    <button
                      onClick={() => setActiveTab('manual')}
                      className={`flex-1 px-6 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'manual'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>✏️</span>
                        Thêm thủ công
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('import')}
                      className={`flex-1 px-6 py-3 font-medium text-sm transition-all duration-200 ${activeTab === 'import'
                        ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>📁</span>
                        Import từ file
                      </span>
                    </button>
                  </div>                {/* Tab Content */}
                  <div className="bg-white p-6">
                    {activeTab === 'manual' ? (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <span className="text-red-500">*</span> Mã sinh viên
                            </label>
                            <input
                              type="text"
                              value={newStudent.student_id}
                              onChange={(e) => setNewStudent({ ...newStudent, student_id: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Nhập mã sinh viên"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <span className="text-red-500">*</span> Họ và tên
                            </label>
                            <input
                              type="text"
                              value={newStudent.full_name}
                              onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Nhập họ và tên"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              <span className="text-red-500">*</span> Lớp
                            </label>
                            <input
                              type="text"
                              value={newStudent.class}
                              onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Nhập lớp"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              RFID UID
                            </label>
                            <input
                              type="text"
                              value={newStudent.rfid_uid}
                              onChange={(e) => setNewStudent({ ...newStudent, rfid_uid: e.target.value })}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Nhập RFID UID (không bắt buộc)"
                            />
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <span>💡</span>
                            Các trường có dấu <span className="text-red-500 font-semibold">*</span> là bắt buộc
                          </p>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowAddModal(false)}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleAddManualStudent}
                            disabled={submitting}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                          >
                            {submitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang thêm...
                              </>
                            ) : (
                              <>
                                <span>➕</span>
                                Thêm sinh viên
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          <span className="flex items-center gap-2">
                            <span>📂</span>
                            Chọn file CSV/Excel
                          </span>
                        </label>
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          className="w-full p-3 border-2 border-dashed border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 transition-all duration-200 bg-white"
                        />
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <span>📋</span>
                            Định dạng: Mã SV, Họ tên, Lớp, RFID UID (tùy chọn)
                          </p>
                          <a
                            href="/sample_students.csv"
                            download
                            className="text-sm text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1 transition-colors duration-200"
                          >
                            <span>⬇️</span>
                            Tải file mẫu
                          </a>
                        </div>
                      </div>

                        {/* Preview */}
                        {importPreview.length > 0 && (
                          <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3">
                              <h3 className="font-semibold text-white flex items-center gap-2">
                                <span>👁️</span>
                                Xem trước dữ liệu ({importPreview.length} sinh viên)
                              </h3>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Mã SV</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Họ tên</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Lớp</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">RFID UID</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white">
                                  {importPreview.slice(0, 10).map((student, idx) => (
                                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                      <td className="px-4 py-3">{student.student_id}</td>
                                      <td className="px-4 py-3">{student.full_name}</td>
                                      <td className="px-4 py-3">{student.class}</td>
                                      <td className="px-4 py-3">{student.rfid_uid}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {importPreview.length > 10 && (
                                <div className="bg-gray-50 text-center text-gray-500 py-3 border-t border-gray-200">
                                  ... và {importPreview.length - 10} sinh viên khác
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setShowAddModal(false)}
                            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-200 font-medium"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleBulkImport}
                            disabled={submitting || importPreview.length === 0}
                            className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                          >
                            {submitting ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang import...
                              </>
                            ) : (
                              <>
                                <span>📤</span>
                                Import {importPreview.length} sinh viên
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;
