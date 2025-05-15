import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Service for teacher-related operations
 */
export interface ClassInfo {
  id: number;
  name: string;
  subject: string;
  schedule: string;
  room: string;
  semester?: string;
  startDate?: string;
  endDate?: string;
  start_time?: string; // thêm trường này
  end_time?: string;   // thêm trường này
}

// Mock data for offline development
const MOCK_DATA = {
  USE_MOCK: false, // Đặt thành false khi API hoạt động
  classes: [
    {
      id: 1,
      name: 'CS101-01',
      subject: 'Nhập môn lập trình',
      schedule: 'Thứ 2, 4 (7:30 - 9:30)',
      room: 'A203'
    },
    {
      id: 2,
      name: 'CS201-01',
      subject: 'Cấu trúc dữ liệu và giải thuật',
      schedule: 'Thứ 3, 5 (13:30 - 15:30)',
      room: 'B304'
    },
    {
      id: 3,
      name: 'CS301-01',
      subject: 'Trí tuệ nhân tạo',
      schedule: 'Thứ 6 (7:30 - 10:30)',
      room: 'C105'
    }
  ],
  students: [
    { id: 1, studentId: 'SV001', name: 'Nguyễn Văn An', email: 'an.sv001@example.com', rfid: 'RFID001' },
    { id: 2, studentId: 'SV002', name: 'Trần Thị Bình', email: 'binh.sv002@example.com', rfid: 'RFID002' },
    { id: 3, studentId: 'SV003', name: 'Lê Văn Cường', email: 'cuong.sv003@example.com', rfid: null },
    { id: 4, studentId: 'SV004', name: 'Phạm Thị Dung', email: 'dung.sv004@example.com', rfid: 'RFID004' }
  ],  attendanceRecords: [
    { 
      id: 1, 
      studentId: 'SV001', 
      studentName: 'Nguyễn Văn An', 
      date: '2025-05-06', 
      status: 'present' as 'present' | 'absent' | 'late', 
      time: '07:35:22',
      student_id: 'SV001',
      full_name: 'Nguyễn Văn An',
      student_class: 'CS101-01',
      rfid_uid: 'RFID001',
      attendance: {
        status: 'present' as 'present' | 'absent' | 'late',
        check_in_time: '2025-05-06 07:35:22',
        notes: null,
        verified: 1
      }
    },
    { 
      id: 2, 
      studentId: 'SV002', 
      studentName: 'Trần Thị Bình', 
      date: '2025-05-06', 
      status: 'absent' as 'present' | 'absent' | 'late', 
      time: undefined,
      student_id: 'SV002',
      full_name: 'Trần Thị Bình',
      student_class: 'CS101-01',
      rfid_uid: 'RFID002',
      attendance: {
        status: 'absent' as 'present' | 'absent' | 'late',
        check_in_time: null,
        notes: null,
        verified: 0
      }
    },
    { 
      id: 3, 
      studentId: 'SV003', 
      studentName: 'Lê Văn Cường', 
      date: '2025-05-06', 
      status: 'late' as 'present' | 'absent' | 'late', 
      time: '07:52:15',
      student_id: 'SV003',
      full_name: 'Lê Văn Cường',
      student_class: 'CS101-01',
      rfid_uid: null,
      attendance: {
        status: 'late' as 'present' | 'absent' | 'late',
        check_in_time: '2025-05-06 07:52:15',
        notes: 'Đến muộn 22 phút',
        verified: 1
      }
    },
    { 
      id: 4, 
      studentId: 'SV004', 
      studentName: 'Phạm Thị Dung', 
      date: '2025-05-06', 
      status: 'present' as 'present' | 'absent' | 'late', 
      time: '07:28:45',
      student_id: 'SV004',
      full_name: 'Phạm Thị Dung',
      student_class: 'CS101-01',
      rfid_uid: 'RFID004',
      attendance: {
        status: 'present' as 'present' | 'absent' | 'late',
        check_in_time: '2025-05-06 07:28:45',
        notes: null,
        verified: 1
      }
    }
  ],
  // Giữ lại attendance cũ để tương thích với code hiện có
  attendance: [
    { id: 1, studentId: 'SV001', studentName: 'Nguyễn Văn An', date: '2025-05-06', status: 'present', time: '07:35:22' },
    { id: 2, studentId: 'SV002', studentName: 'Trần Thị Bình', date: '2025-05-06', status: 'absent', time: null },
    { id: 3, studentId: 'SV003', studentName: 'Lê Văn Cường', date: '2025-05-06', status: 'late', time: '07:52:15' },
    { id: 4, studentId: 'SV004', studentName: 'Phạm Thị Dung', date: '2025-05-06', status: 'present', time: '07:28:45' }
  ]
};

export interface Student {
  student_id: string;
  full_name: string;
  student_class: string;
  rfid_uid?: string | null;
}

export interface AttendanceRecord {
  student_id: string;
  full_name: string;
  student_class: string;
  rfid_uid: string | null;
  attendance?: {
    attendance_id?: number | null; // thêm dòng này để đồng bộ với backend
    status: 'present' | 'absent' | 'late';
    check_in_time: string | null;
    notes: string | null;
    verified: number;
  };
  
  // Các trường tương thích với phiên bản cũ - cho component AttendanceView
  id?: number;
  studentId?: string;
  studentName?: string;
  date?: string;
  status?: 'present' | 'absent' | 'late';
  time?: string;
}

export interface ScheduleChange {
  id?: number;
  classId: number;
  originalDate: string;
  newDate?: string;
  originalRoom: string;
  newRoom?: string;
  reason: string;
}

/**
 * TeacherService handles all API calls related to teacher functions
 */
export class TeacherService {
  /**
   * Get all classes that the teacher is currently teaching
   */  async getTeacherClasses(): Promise<ClassInfo[]> {
    // Sử dụng mock data khi đang phát triển
    if (MOCK_DATA.USE_MOCK) {
      console.log('Using mock data for teacher classes');
      return new Promise(resolve => {
        setTimeout(() => resolve(MOCK_DATA.classes), 300);
      });
    }
    
    // Sử dụng API thực tế khi đã sẵn sàng
    try {      const response = await axios.get(`${API_BASE_URL}/teacher/classes.php`);
      return response.data?.classes || [];

    } catch (error) {
      console.error('Failed to fetch teacher classes:', error);
      throw error;
    }
  }

  /**
   * Get all students enrolled in a specific class
   * @param classId - The ID of the class
   */  async getClassStudents(classId: number): Promise<Student[]> {
    if (MOCK_DATA.USE_MOCK) {
      // ...existing code...
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/teacher/class_students.php`, {
        params: { class_id: classId }
      });
      let data = response.data;
      // Nếu backend trả về chuỗi chứa warning + JSON, cố gắng tách JSON
      if (typeof data === 'string') {
        const jsonStart = data.indexOf('{');
        const jsonEnd = data.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          try {
            data = JSON.parse(data.substring(jsonStart, jsonEnd + 1));
          } catch (e) {
            console.error('Lỗi parse JSON từ response:', e, data);
            return [];
          }
        } else {
          return [];
        }
      }
      return data?.students || [];
    } catch (error) {
      console.error(`Failed to fetch students for class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Get the teaching schedule for a specific class
   * @param classId - The ID of the class
   */
  async getClassSchedule(classId: number): Promise<ClassInfo> {
    // Sử dụng mock data khi API chưa sẵn sàng hoặc đang phát triển
    if (MOCK_DATA.USE_MOCK) {
      console.log('Using mock data for class schedule');
      const classInfo = MOCK_DATA.classes.find(c => c.id === classId);
      return new Promise(resolve => {
        setTimeout(() => resolve(classInfo || MOCK_DATA.classes[0]), 300);
      });
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/teacher/class_teaching_schedule.php`, {
        params: { class_id: classId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch schedule for class ${classId}:`, error);
      throw error;
    }
  }
  /**
   * Get attendance records for a specific class on a specific date
   * @param classId - The ID of the class
   * @param date - The date to get attendance for (YYYY-MM-DD format)
   */  async getClassAttendanceByDate(classId: number, date: string): Promise<AttendanceRecord[]> {
    // Sử dụng mock data khi API chưa sẵn sàng hoặc đang phát triển
    if (MOCK_DATA.USE_MOCK) {
      console.log('Using mock data for attendance');
      return new Promise(resolve => {
        setTimeout(() => resolve(MOCK_DATA.attendanceRecords as AttendanceRecord[]), 300);
      });
    }
    
    try {
      // Log request details for debugging
      console.log(`Fetching attendance for class ${classId} on ${date}`);
      console.log(`URL: ${API_BASE_URL}/teacher/class_attendance_by_date.php?classId=${classId}&date=${date}`);
      
      const response = await axios.get(`${API_BASE_URL}/teacher/class_attendance_by_date.php`, {
        params: { classId, date },
        withCredentials: true, // Ensure credentials are sent
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Response received:', response.status);
      
      // Process the response data
      if (response.data && response.data.success && response.data.students) {
        console.log(`Successfully fetched data for ${response.data.students.length} students`);
        
        // Chuyển đổi dữ liệu để tương thích với AttendanceView component
        const processedRecords = response.data.students.map((student: any, index: number) => ({
          ...student,
          id: index + 1, // Generate an ID for the UI component
          studentId: student.student_id,
          studentName: student.full_name,
          date: date,
          status: student.attendance?.status || 'absent',
          time: student.attendance?.check_in_time 
            ? new Date(student.attendance.check_in_time).toLocaleTimeString('vi-VN')
            : undefined
        }));
        
        return processedRecords;
      }
      
      console.warn('Response format unexpected:', response.data);
      return [];
    } catch (error) {
      console.error(`Failed to fetch attendance for class ${classId} on ${date}:`, error);
      throw error;
    }
  }

  /**
   * Get attendance report for a specific class (all dates)
   * @param classId - The ID of the class
   */
  async getAttendanceReport(classId: number): Promise<AttendanceRecord[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/teacher/attendance_report.php`, {
        params: { classId }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch attendance report for class ${classId}:`, error);
      throw error;
    }
  }

  /**
   * Update or create attendance record for a student
   * @param params - Full record for both update and create
   */
  async updateAttendance(
    params: {
      attendanceId?: number;
      student_id: string;
      status: 'present' | 'absent' | 'late';
      room: string;
      course_id: number;
      checkin_time: string;
      rfid_uid?: string | null;
    }
  ): Promise<boolean> {
    try {
      // Always send the full payload for both update and create
      const payload = {
        attendanceId: params.attendanceId ?? 0,
        student_id: params.student_id,
        status: params.status,
        room: params.room,
        course_id: params.course_id,
        checkin_time: params.checkin_time,
        rfid_uid: params.rfid_uid ?? null,
      };
      const response = await axios.post(`${API_BASE_URL}/teacher/update_attendance.php`, payload);
      return response.data.success;
    } catch (error) {
      console.error('Failed to update/create attendance record:', error);
      throw error;
    }
  }

  /**
   * Record manual attendance for a student
   * @param classId - The ID of the class
   * @param studentId - The ID of the student
   * @param date - The date for the attendance
   * @param status - The attendance status
   */
  async recordManualAttendance(
    classId: number, 
    studentId: number, 
    date: string, 
    status: 'present' | 'absent' | 'late'
  ): Promise<boolean> {
    try {
      const response = await axios.post(`${API_BASE_URL}/teacher/manual_attendance.php`, {
        classId,
        studentId,
        date,
        status
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to record manual attendance:', error);
      throw error;
    }
  }

  /**
   * Update class schedule for emergencies
   * @param scheduleChange - The details of the schedule change
   */
  async updateSchedule(scheduleChange: ScheduleChange): Promise<boolean> {
    try {
      const response = await axios.post(`${API_BASE_URL}/teacher/manage_schedule_changes.php`, scheduleChange);
      return response.data.success;
    } catch (error) {
      console.error('Failed to update class schedule:', error);
      throw error;
    }
  }
  /**
   * Export attendance data for a class
   * @param classId - The ID of the class
   * @param format - Export format (csv or pdf)
   */
  async exportAttendance(classId: number, format: 'csv' | 'pdf'): Promise<string> {
    try {
      const response = await axios.get(`${API_BASE_URL}/teacher/export_attendance.php`, {
        params: { classId, format },
        responseType: 'blob'
      });
      
      // Create a download URL for the file
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv' : 'application/pdf' 
      });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Failed to export attendance for class ${classId}:`, error);
      throw error;
    }
  }
  
  /**
   * Submit attendance for multiple students at once
   * @param classId - The ID of the class
   * @param date - The date for the attendance (YYYY-MM-DD format)
   * @param attendanceData - Array of student attendance records
   */
  async submitBulkAttendance(
    classId: number, 
    date: string,
    attendanceData: Array<{ studentId: string, status: 'present' | 'absent' | 'late' }>
  ): Promise<boolean> {
    try {
      const response = await axios.post(`${API_BASE_URL}/teacher/quick_rfid_attendance.php`, {
        classId,
        date,
        attendanceData
      });
      return response.data.success;
    } catch (error) {
      console.error('Failed to submit bulk attendance:', error);
      throw error;
    }
  }
}

export default new TeacherService();