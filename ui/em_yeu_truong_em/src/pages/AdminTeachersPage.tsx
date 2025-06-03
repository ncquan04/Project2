import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API_URL } from '../services/authService';
import * as XLSX from 'xlsx';

interface Teacher {
  teacher_id: number;
  full_name: string;
  department: string;
  position: string;
  employee_id: string;
}

interface NewTeacher {
  full_name: string;
  department: string;
  position: string;
  employee_id: string;
}

interface EditTeacher extends NewTeacher {
  teacher_id: number;
}

const AdminTeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const [newTeacher, setNewTeacher] = useState<NewTeacher>({
    full_name: '',
    department: '',
    position: '',
    employee_id: ''
  });  const [editTeacher, setEditTeacher] = useState<EditTeacher>({
    teacher_id: 0,
    full_name: '',
    department: '',
    position: '',
    employee_id: ''
  });
  const [importPreview, setImportPreview] = useState<NewTeacher[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'full_name' | 'department' | 'position' | 'employee_id'>('full_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const loadTeachers = () => {
    setLoading(true);
    fetch(`${API_URL}/admin/teachers.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setTeachers(data.teachers);
        else setError('Không thể tải danh sách giáo viên');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.full_name || !newTeacher.department || !newTeacher.position || !newTeacher.employee_id) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/admin/teachers.php?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTeacher)
      });

      const data = await response.json();
      console.log('Add teacher response:', data);

      if (data.success) {
        alert('Thêm giáo viên thành công!');
        setNewTeacher({ full_name: '', department: '', position: '', employee_id: '' });
        setShowAddModal(false);
        loadTeachers();
      } else {
        console.error('Add teacher error:', data);
        alert(data.message || data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTeacher = async () => {
    if (!editTeacher.full_name || !editTeacher.department || !editTeacher.position || !editTeacher.employee_id) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/admin/teachers.php?action=edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editTeacher)
      });

      const data = await response.json();
      console.log('Edit teacher response:', data);

      if (data.success) {
        alert('Cập nhật giáo viên thành công!');
        setShowEditModal(false);
        loadTeachers();
      } else {
        console.error('Edit teacher error:', data);
        alert(data.message || data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async (teacherId: number, fullName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa giáo viên "${fullName}"?`)) {
      return;
    }

    setDeleting(teacherId);
    try {
      const response = await fetch(`${API_URL}/admin/teachers.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teacher_id: teacherId })
      });

      const data = await response.json();
      console.log('Delete teacher response:', data);

      if (data.success) {
        alert('Xóa giáo viên thành công!');
        loadTeachers();
      } else {
        console.error('Delete teacher error:', data);
        alert(data.message || data.error || 'Có lỗi xảy ra khi xóa giáo viên');
      }
    } catch (error) {
      console.error('Delete teacher error:', error);
      alert('Lỗi kết nối server');
    } finally {
      setDeleting(null);
    }
  };

  const openEditModal = (teacher: Teacher) => {
    setEditTeacher({
      teacher_id: teacher.teacher_id,
      full_name: teacher.full_name,
      department: teacher.department,
      position: teacher.position,
      employee_id: teacher.employee_id
    });
    setShowEditModal(true);
  };

  const parseCSV = (text: string): NewTeacher[] => {
    const lines = text.trim().split('\n');
    const data: NewTeacher[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 4) {
        data.push({
          full_name: values[0] || '',
          department: values[1] || '',
          position: values[2] || '',
          employee_id: values[3] || ''
        });
      }
    }
    return data;
  };

  const parseExcel = (file: File): Promise<NewTeacher[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          const teachers: NewTeacher[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length >= 4) {
              teachers.push({
                full_name: row[0]?.toString() || '',
                department: row[1]?.toString() || '',
                position: row[2]?.toString() || '',
                employee_id: row[3]?.toString() || ''
              });
            }
          }
          resolve(teachers);
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
      let preview: NewTeacher[] = [];

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
      const response = await fetch(`${API_URL}/admin/bulk_add_teachers.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teachers: importPreview })
      });

      const data = await response.json();
      console.log('Bulk import response:', data);

      if (data.success) {
        alert(`Import thành công ${data.added_count || importPreview.length} giáo viên!`);
        setImportPreview([]);
        setShowAddModal(false);
        loadTeachers();
      } else {
        console.error('Bulk import error:', data);
        let errorMessage = data.message || 'Có lỗi xảy ra';
        if (data.errors && data.errors.length > 0) {
          errorMessage += '\n' + data.errors.join('\n');
        }
        alert(errorMessage);
      }
    } catch (error) {
      alert('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and sort teachers
  const filteredAndSortedTeachers = teachers
    .filter(teacher =>
      teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSort = (column: 'full_name' | 'department' | 'position' | 'employee_id') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  return (
    <div className="w-screen min-h-screen bg-gray-100 text-gray-900">
      <Header />
      <div className="max-w-6xl mx-auto py-8 px-4">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Quản lý giáo viên</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            ➕ Thêm giáo viên
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm giáo viên
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo họ tên, khoa, chức vụ, hoặc mã nhân viên..."
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
                  onChange={(e) => setSortBy(e.target.value as 'full_name' | 'department' | 'position' | 'employee_id')}
                  className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full_name">Họ tên</option>
                  <option value="department">Khoa</option>
                  <option value="position">Chức vụ</option>
                  <option value="employee_id">Mã NV</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={`Sắp xếp ${sortOrder === 'asc' ? 'giảm dần' : 'tăng dần'}`}
              >
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Hiển thị {filteredAndSortedTeachers.length} / {teachers.length} giáo viên
          </p>
        </div>

        {/* Teachers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p>{error}</p>
              <button 
                onClick={loadTeachers}
                className="mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('full_name')}
                    >
                      Họ tên {sortBy === 'full_name' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('department')}
                    >
                      Khoa {sortBy === 'department' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('position')}
                    >
                      Chức vụ {sortBy === 'position' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('employee_id')}
                    >
                      Mã nhân viên {sortBy === 'employee_id' && (sortOrder === 'asc' ? '⬆️' : '⬇️')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedTeachers.map((teacher) => (
                    <tr key={teacher.teacher_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{teacher.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{teacher.employee_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher.teacher_id, teacher.full_name)}
                          disabled={deleting === teacher.teacher_id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === teacher.teacher_id ? '⏳' : '🗑️'} Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredAndSortedTeachers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {searchTerm ? 'Không tìm thấy giáo viên nào phù hợp với tìm kiếm' : 'Chưa có giáo viên nào'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Thêm giáo viên mới</h2>
            
            {/* Tab Navigation */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'manual'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Thêm thủ công
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`px-4 py-2 font-medium ${
                  activeTab === 'import'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Import từ file
              </button>
            </div>

            {activeTab === 'manual' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeacher.full_name}
                    onChange={(e) => setNewTeacher({...newTeacher, full_name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập họ tên giáo viên"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khoa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeacher.department}
                    onChange={(e) => setNewTeacher({...newTeacher, department: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập tên khoa"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chức vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeacher.position}
                    onChange={(e) => setNewTeacher({...newTeacher, position: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập chức vụ"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã nhân viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTeacher.employee_id}
                    onChange={(e) => setNewTeacher({...newTeacher, employee_id: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nhập mã nhân viên"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn file CSV hoặc Excel
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    File phải có cấu trúc: Họ tên, Khoa, Chức vụ, Mã nhân viên
                  </p>
                </div>

                {importPreview.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Xem trước dữ liệu ({importPreview.length} giáo viên):</h3>
                    <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">Họ tên</th>
                            <th className="px-3 py-2 text-left">Khoa</th>
                            <th className="px-3 py-2 text-left">Chức vụ</th>
                            <th className="px-3 py-2 text-left">Mã NV</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((teacher, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">{teacher.full_name}</td>
                              <td className="px-3 py-2">{teacher.department}</td>
                              <td className="px-3 py-2">{teacher.position}</td>
                              <td className="px-3 py-2">{teacher.employee_id}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setImportPreview([]);
                  setActiveTab('manual');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Hủy
              </button>
              {activeTab === 'manual' ? (
                <button
                  onClick={handleAddTeacher}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang thêm...' : 'Thêm giáo viên'}
                </button>
              ) : (
                <button
                  onClick={handleBulkImport}
                  disabled={submitting || importPreview.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang import...' : `Import ${importPreview.length} giáo viên`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Chỉnh sửa thông tin giáo viên</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTeacher.full_name}
                  onChange={(e) => setEditTeacher({...editTeacher, full_name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập họ tên giáo viên"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTeacher.department}
                  onChange={(e) => setEditTeacher({...editTeacher, department: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên khoa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức vụ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTeacher.position}
                  onChange={(e) => setEditTeacher({...editTeacher, position: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập chức vụ"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã nhân viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTeacher.employee_id}
                  onChange={(e) => setEditTeacher({...editTeacher, employee_id: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mã nhân viên"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                onClick={handleEditTeacher}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachersPage;
