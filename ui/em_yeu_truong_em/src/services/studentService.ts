import { API_URL } from './authService';

// Định nghĩa kiểu dữ liệu cho thông tin lớp học
export interface ClassInfo {
  class_id: number;
  class_code: string;
  course_code: string;
  course_name: string;
  teacher_name: string;
  credits: number;
  schedule_day: string;
  schedule_day_vi: string; // Tên ngày trong tuần bằng tiếng Việt
  formatted_time: string; // Thời gian đã định dạng (ví dụ: 7:30 - 9:30)
  room: string;
  semester: string;
  is_active: boolean;
}

// Mở rộng ClassInfo cho màn hình chi tiết điểm danh
export interface ClassInfoDetail extends ClassInfo {
  start_date: string;
  end_date: string;
}

// Định nghĩa kiểu dữ liệu cho thông tin buổi học
export interface SessionInfo {
  session_id: number;
  class_id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

// Định nghĩa kiểu dữ liệu cho thống kê điểm danh
export interface AttendanceSummary {
  total_sessions: number;
  attended: number;
  absent: number;
  attendance_rate: number;
}

// Định nghĩa kiểu dữ liệu chi tiết lớp học kèm thông tin điểm danh
export interface ClassDetail {
  class_info: ClassInfoDetail;
  attendance_summary: AttendanceSummary;
}

// Định nghĩa kiểu dữ liệu cho response từ API
interface ClassResponse {
  success: boolean;
  message: string;
  classes?: ClassInfo[];
}

// Định nghĩa kiểu dữ liệu cho response từ API điểm danh
interface AttendanceResponse {
  success: boolean;
  message: string;
  class_details: ClassDetail;
  sessions: SessionInfo[];
}

// Định nghĩa kiểu dữ liệu cho bản ghi điểm danh trong lịch sử
export interface AttendanceRecord {
  id: number;
  date: string;
  time: string;
  class_name: string;
  course_code: string;
  teacher_name: string;
  status: 'present' | 'absent' | 'late';
  room?: string;
  notes?: string;
}

// Định nghĩa kiểu dữ liệu cho response từ API lịch sử điểm danh
interface AttendanceHistoryResponse {
  success: boolean;
  message: string;
  records?: AttendanceRecord[];
}

/**
 * Hàm lấy tất cả các lớp học của một sinh viên
 * @param studentId Mã sinh viên
 * @returns Promise<ClassInfo[]>
 */
export const getAllClasses = async (studentId: string): Promise<ClassInfo[]> => {
  try {
    const response = await fetch(`${API_URL}/student/studentClasses.php?action=get_all_classes&student_id=${studentId}`, {
      method: 'GET',
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      return [];
    }

    const data: ClassResponse = await response.json();
    console.log('Raw API response (getAllClasses):', data);
    
    if (data.success && data.classes) {
      return data.classes;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all classes:', error);
    return [];
  }
};

/**
 * Hàm lấy các lớp học đang hoạt động (học kỳ hiện tại) của một sinh viên
 * @param studentId Mã sinh viên
 * @returns Promise<ClassInfo[]>
 */
export const getActiveClasses = async (studentId: string): Promise<ClassInfo[]> => {
  try {
    const response = await fetch(`${API_URL}/student/studentClasses.php?action=get_active_classes&student_id=${studentId}`, {
      method: 'GET',
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      return [];
    }

    const data: ClassResponse = await response.json();
    console.log('Raw API response (getActiveClasses):', data);
    
    if (data.success && data.classes) {
      return data.classes;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching active classes:', error);
    return [];
  }
};

/**
 * Hàm lấy thông tin chi tiết của một lớp học
 * @param classId ID của lớp học
 * @returns Promise<ClassInfo | null>
 */
export const getClassDetails = async (classId: number): Promise<ClassInfo | null> => {
  try {
    const response = await fetch(`${API_URL}/student/studentClasses.php?action=get_class_details&class_id=${classId}`, {
      method: 'GET',
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('Raw API response (getClassDetails):', data);
    
    if (data.success && data.class) {
      return data.class;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching class details:', error);
    return null;
  }
};

/**
 * Hàm lấy thông tin điểm danh của một sinh viên trong một lớp học cụ thể
 * @param classId ID của lớp học
 * @param studentId Mã sinh viên
 * @returns Promise<{class_details: ClassDetail, sessions: SessionInfo[]}>
 */
export const getClassAttendance = async (
  classId: string, 
  studentId: string
): Promise<{class_details: ClassDetail, sessions: SessionInfo[]}> => {
  try {
    const response = await fetch(`${API_URL}/student/classAttendance.php?action=get_class_attendance&class_id=${classId}&student_id=${studentId}`, {
      method: 'GET',
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      throw new Error(`Server returned ${response.status}`);
    }

    const data: AttendanceResponse = await response.json();
    console.log('Raw API response (getClassAttendance):', data);
    
    if (data.success) {
      return {
        class_details: data.class_details,
        sessions: data.sessions
      };
    }
    
    throw new Error(data.message || 'Failed to get attendance data');
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    throw error;
  }
};

/**
 * Hàm lấy lịch sử điểm danh của một sinh viên
 * @param studentId Mã sinh viên
 * @returns Promise<AttendanceRecord[]>
 */
export const getAttendanceHistory = async (studentId: string): Promise<AttendanceRecord[]> => {
  try {
    const response = await fetch(`${API_URL}/student/studentAttendance.php?action=get_attendance_history&student_id=${studentId}`, {
      method: 'GET',
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      return [];
    }

    const data: AttendanceHistoryResponse = await response.json();
    console.log('Raw API response (getAttendanceHistory):', data);
    
    if (data.success && data.records) {
      return data.records;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return [];
  }
};