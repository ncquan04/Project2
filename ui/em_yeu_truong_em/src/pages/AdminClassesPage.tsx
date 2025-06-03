import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { API_URL } from '../services/authService';

interface Class {
  class_id: number;
  class_code: string;
  course_id: number;
  teacher_id: number;
  room: string;
  semester: string;
  schedule_day: string;
  start_time: string;
  end_time: string;
  start_date: string;
  end_date: string;
  course_name?: string;
  course_code_ref?: string;
}

interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
}

interface Teacher {
  teacher_id: number;
  full_name: string;
  department: string;
  position: string;
  employee_id: string;
}

interface Student {
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  class: string;
  rfid_uid?: string;
}

interface ClassStudent {
  student_id: string;
  student_code: string;
  full_name: string;
  email: string;
  enrollment_date: string;
}

const AdminClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'class_code' | 'course_id' | 'room' | 'semester' | 'schedule_day'>('class_code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');const [formData, setFormData] = useState({
    class_code: '',
    course_id: '',
    teacher_id: '',
    room: '',
    semester: '',
    schedule_day: '',
    start_time: '',
    end_time: '',
    start_date: '',
    end_date: ''
  });
  const [submitting, setSubmitting] = useState(false);  useEffect(() => {
    // Load classes
    fetch(`${API_URL}/admin/classes.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setClasses(data.classes);
        else setError('Không thể tải danh sách lớp học');
      })
      .catch(() => setError('Lỗi kết nối server'))
      .finally(() => setLoading(false));

    // Load courses
    fetch(`${API_URL}/admin/courses.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setCourses(data.courses);
      })
      .catch(() => console.error('Failed to load courses'));    // Load teachers
    fetch(`${API_URL}/admin/teachers.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setTeachers(data.teachers);
      })
      .catch(() => console.error('Failed to load teachers'));

    // Load all students for adding to classes
    fetch(`${API_URL}/admin/students.php?action=list`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) setStudents(data.students);
      })
      .catch(() => console.error('Failed to load students'));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Convert string values to appropriate types
      const submitData = {
        ...formData,
        course_id: parseInt(formData.course_id),
        teacher_id: parseInt(formData.teacher_id)
      };

      const response = await fetch(`${API_URL}/admin/classes.php?action=add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      });

      const data = await response.json();
      if (data.success) {
        // Refresh the list instead of trying to add to local state
        const refreshResponse = await fetch(`${API_URL}/admin/classes.php?action=list`, { credentials: 'include' });
        const refreshData = await refreshResponse.json();
        if (refreshData.success) setClasses(refreshData.classes);
        
        setFormData({ 
          class_code: '', 
          course_id: '', 
          teacher_id: '', 
          room: '', 
          semester: '', 
          schedule_day: '', 
          start_time: '', 
          end_time: '', 
          start_date: '', 
          end_date: '' 
        });
        setShowForm(false);
        setError(null);
      } else {
        setError(data.error || 'Không thể tạo lớp học');
      }
    } catch (err) {
      console.error('Error creating class:', err);
      setError('Lỗi kết nối server');
    } finally {
      setSubmitting(false);
    }
  };  const handleDelete = async (classId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lớp học này?')) return;
    try {
      const response = await fetch(`${API_URL}/admin/classes.php?action=delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ class_id: classId })
      });
      const data = await response.json();
      if (data.success) {
        setClasses(classes.filter(cls => cls.class_id !== classId));
        setError(null);
      } else {
        setError(data.error || 'Không thể xóa lớp học');
      }
    } catch {
      setError('Lỗi kết nối server');
    }
  };

  // Load students for a specific class
  const loadClassStudents = async (classId: number) => {
    setLoadingStudents(true);
    try {
      const response = await fetch(`${API_URL}/admin/classes.php?action=getStudents&class_id=${classId}`, { 
        credentials: 'include' 
      });
      const data = await response.json();
      if (data.success) {
        setClassStudents(data.students);
      } else {
        setError(data.error || 'Không thể tải danh sách sinh viên');
      }
    } catch (err) {
      console.error('Error loading class students:', err);
      setError('Lỗi kết nối server');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Show students modal
  const handleViewStudents = (classId: number) => {
    setSelectedClassId(classId);
    setShowStudentsModal(true);
    loadClassStudents(classId);
  };
  // Add student to class
  const handleAddStudentToClass = async (studentId: string) => {
    if (!selectedClassId) return;
    try {
      const response = await fetch(`${API_URL}/admin/classes.php?action=addStudent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          class_id: selectedClassId, 
          student_id: studentId 
        })
      });
      const data = await response.json();
      if (data.success) {
        loadClassStudents(selectedClassId); // Refresh the list
        setError(null);
      } else {
        setError(data.error || 'Không thể thêm sinh viên vào lớp');
      }
    } catch (err) {
      console.error('Error adding student to class:', err);
      setError('Lỗi kết nối server');
    }
  };

  // Remove student from class
  const handleRemoveStudentFromClass = async (studentId: string) => {
    if (!selectedClassId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa sinh viên này khỏi lớp?')) return;
    try {
      const response = await fetch(`${API_URL}/admin/classes.php?action=removeStudent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          class_id: selectedClassId, 
          student_id: studentId 
        })
      });
      const data = await response.json();
      if (data.success) {
        loadClassStudents(selectedClassId); // Refresh the list
        setError(null);
      } else {
        setError(data.error || 'Không thể xóa sinh viên khỏi lớp');
      }
    } catch (err) {
      console.error('Error removing student from class:', err);
      setError('Lỗi kết nối server');
    }
  };

  // Filter students for search
  const filteredStudents = students.filter(student => 
    !classStudents.some(cs => cs.student_id === student.student_id) &&
    (student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     student.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const weekdayMap: Record<string, string> = {
    monday: 'Thứ Hai',
    tuesday: 'Thứ Ba',
    wednesday: 'Thứ Tư',
    thursday: 'Thứ Năm',
    friday: 'Thứ Sáu',
    saturday: 'Thứ Bảy',
    sunday: 'Chủ Nhật',
  };

  // Filter and sort classes
  const filteredAndSortedClasses = classes
    .filter(cls => 
      cls.class_code.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
      cls.room.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
      cls.semester.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
      (weekdayMap[cls.schedule_day] || cls.schedule_day).toLowerCase().includes(classSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string;
      let bValue: string;
      
      switch (sortBy) {
        case 'class_code':
          aValue = a.class_code.toLowerCase();
          bValue = b.class_code.toLowerCase();
          break;
        case 'course_id':
          aValue = a.course_id.toString();
          bValue = b.course_id.toString();
          break;
        case 'room':
          aValue = a.room.toLowerCase();
          bValue = b.room.toLowerCase();
          break;
        case 'semester':
          aValue = a.semester.toLowerCase();
          bValue = b.semester.toLowerCase();
          break;
        case 'schedule_day':
          aValue = (weekdayMap[a.schedule_day] || a.schedule_day).toLowerCase();
          bValue = (weekdayMap[b.schedule_day] || b.schedule_day).toLowerCase();
          break;
        default:
          aValue = a.class_code.toLowerCase();
          bValue = b.class_code.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleSort = (column: 'class_code' | 'course_id' | 'room' | 'semester' | 'schedule_day') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Quản lý lớp học</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium"
          >
            {showForm ? 'Hủy' : 'Thêm lớp học'}
          </button>
        </div>

        {error && <div className="text-red-700 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">{error}</div>}

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tìm kiếm lớp học
              </label>
              <input
                type="text"
                value={classSearchTerm}
                onChange={(e) => setClassSearchTerm(e.target.value)}
                placeholder="Tìm theo mã lớp, phòng, học kỳ hoặc ngày học..."
                className="text-black w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sắp xếp theo
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'class_code' | 'course_id' | 'room' | 'semester' | 'schedule_day')}
                  className="text-black p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="class_code">Mã lớp</option>
                  <option value="course_id">Mã môn học</option>
                  <option value="room">Phòng</option>
                  <option value="semester">Học kỳ</option>
                  <option value="schedule_day">Ngày học</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title={`Hiện tại: ${sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Hiển thị {filteredAndSortedClasses.length} / {classes.length} lớp học
            {classSearchTerm && (
              <span className="ml-2">
                (tìm kiếm: "{classSearchTerm}")
                <button
                  onClick={() => setClassSearchTerm('')}
                  className="ml-1 text-indigo-600 hover:text-indigo-800 underline"
                >
                  Xóa bộ lọc
                </button>
              </span>
            )}
          </div>
        </div>{showForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Thêm lớp học mới</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4"><div>                <label className="block text-sm font-medium mb-1 text-gray-700">Mã lớp</label>
                <input
                  type="text"
                  name="class_code"
                  value={formData.class_code}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                />
              </div>              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Giáo viên</label>                <select
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Chọn giáo viên</option>
                  {teachers.map(teacher => (
                    <option key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.full_name} ({teacher.employee_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phòng</label>                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                />
              </div>              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Môn học</label>                <select
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Chọn môn học</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.course_code} - {course.course_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Ngày học</label>                <select
                  name="schedule_day"
                  value={formData.schedule_day}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                >
                  <option value="">Chọn ngày học</option>
                  <option value="monday">Thứ Hai</option>
                  <option value="tuesday">Thứ Ba</option>
                  <option value="wednesday">Thứ Tư</option>
                  <option value="thursday">Thứ Năm</option>
                  <option value="friday">Thứ Sáu</option>
                  <option value="saturday">Thứ Bảy</option>
                  <option value="sunday">Chủ Nhật</option>
                </select>
              </div>              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Giờ bắt đầu</label>                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Giờ kết thúc</label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                /></div>              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Học kỳ</label>
                <input
                  type="text"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  placeholder="Ví dụ: HK1-2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Ngày bắt đầu</label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Ngày kết thúc</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors"
                  required
                />
              </div>
              <div className="col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium transition-colors duration-200"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        )}        {loading ? <div className="text-gray-600">Đang tải...</div> : (
          <div className="overflow-x-auto rounded shadow bg-white">
            <table className="min-w-full text-sm text-gray-800">              <thead className="bg-indigo-100 text-indigo-900">
                <tr>
                  <th className="py-3 px-4 font-semibold">ID</th>
                  <th 
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-200 transition"
                    onClick={() => handleSort('class_code')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Mã lớp
                      {sortBy === 'class_code' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-200 transition"
                    onClick={() => handleSort('course_id')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Mã môn học
                      {sortBy === 'course_id' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-200 transition"
                    onClick={() => handleSort('room')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Phòng
                      {sortBy === 'room' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-200 transition"
                    onClick={() => handleSort('semester')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Học kỳ
                      {sortBy === 'semester' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 font-semibold cursor-pointer hover:bg-indigo-200 transition"
                    onClick={() => handleSort('schedule_day')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Ngày học
                      {sortBy === 'schedule_day' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Giờ học</th>
                  <th className="py-3 px-4 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>                {filteredAndSortedClasses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      {classSearchTerm ? 'Không tìm thấy lớp học nào phù hợp' : 'Chưa có lớp học nào'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedClasses.map(cls => (
                    <tr key={cls.class_id} className="border-b hover:bg-indigo-50 transition-colors">
                      <td className="py-3 px-4 text-gray-800">{cls.class_id}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{cls.class_code}</td>
                      <td className="py-3 px-4 text-gray-800">{cls.course_id}</td>
                      <td className="py-3 px-4 text-gray-800">{cls.room}</td>
                      <td className="py-3 px-4 text-gray-800">{cls.semester}</td>
                      <td className="py-3 px-4 text-gray-800">{weekdayMap[cls.schedule_day] || cls.schedule_day}</td>
                      <td className="py-3 px-4 text-gray-800">{cls.start_time} - {cls.end_time}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewStudents(cls.class_id)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-indigo-700 transition-colors font-medium"
                          >
                            Sinh viên
                          </button>
                          <button
                            onClick={() => handleDelete(cls.class_id)}
                            className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-700 transition-colors font-medium"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>            </table>
          </div>
        )}{/* Students Modal */}
        {showStudentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
                <h2 className="text-xl font-semibold text-gray-800">
                  Quản lý sinh viên lớp {selectedClassId && classes.find(c => c.class_id === selectedClassId)?.class_code}
                </h2>
                <button
                  onClick={() => {
                    setShowStudentsModal(false);
                    setSelectedClassId(null);
                    setSearchTerm('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">                {/* Current Students */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    Sinh viên trong lớp
                  </h3>
                  {loadingStudents ? (
                    <div className="text-gray-600 flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                      Đang tải...
                    </div>
                  ) : classStudents.length === 0 ? (
                    <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center">
                      Chưa có sinh viên nào trong lớp
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <table className="min-w-full text-sm">
                        <thead className="bg-indigo-50 border-b border-indigo-100">
                          <tr>
                            <th className="py-3 px-4 text-left font-semibold text-indigo-800">Mã SV</th>
                            <th className="py-3 px-4 text-left font-semibold text-indigo-800">Họ tên</th>
                            <th className="py-3 px-4 text-left font-semibold text-indigo-800">Email</th>
                            <th className="py-3 px-4 text-left font-semibold text-indigo-800">Ngày tham gia</th>
                            <th className="py-3 px-4 text-left font-semibold text-indigo-800">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classStudents.map(student => (
                            <tr key={student.student_id} className="border-b border-gray-100 hover:bg-indigo-25 transition-colors">
                              <td className="py-3 px-4 text-gray-700 font-medium">{student.student_code}</td>
                              <td className="py-3 px-4 text-gray-800 font-medium">{student.full_name}</td>
                              <td className="py-3 px-4 text-gray-600">{student.email}</td>
                              <td className="py-3 px-4 text-gray-600">{new Date(student.enrollment_date).toLocaleDateString('vi-VN')}</td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleRemoveStudentFromClass(student.student_id)}
                                  className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition-colors font-medium shadow-sm"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>                {/* Add Students */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                    Thêm sinh viên vào lớp
                  </h3>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Tìm kiếm sinh viên theo tên hoặc mã SV..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-colors placeholder-gray-500"
                    />
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="text-gray-500 italic bg-gray-50 p-4 rounded-lg text-center">
                      {searchTerm ? 'Không tìm thấy sinh viên phù hợp' : 'Tất cả sinh viên đã được thêm vào lớp'}
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                      <table className="min-w-full text-sm">
                        <thead className="bg-emerald-50 border-b border-emerald-100 sticky top-0">
                          <tr>
                            <th className="py-3 px-4 text-left font-semibold text-emerald-800">Mã SV</th>
                            <th className="py-3 px-4 text-left font-semibold text-emerald-800">Họ tên</th>
                            <th className="py-3 px-4 text-left font-semibold text-emerald-800">Email</th>
                            <th className="py-3 px-4 text-left font-semibold text-emerald-800">Lớp</th>
                            <th className="py-3 px-4 text-left font-semibold text-emerald-800">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map(student => (
                            <tr key={student.student_id} className="border-b border-gray-100 hover:bg-emerald-25 transition-colors">
                              <td className="py-3 px-4 text-gray-700 font-medium">{student.student_id}</td>
                              <td className="py-3 px-4 text-gray-800 font-medium">{student.full_name}</td>
                              <td className="py-3 px-4 text-gray-600">{student.email}</td>
                              <td className="py-3 px-4 text-gray-600">{student.class}</td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => handleAddStudentToClass(student.student_id)}
                                  className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-emerald-600 transition-colors font-medium shadow-sm"
                                >
                                  Thêm
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminClassesPage;
