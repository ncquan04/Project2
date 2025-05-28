import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import teacherService, { ClassInfo } from '../services/teacherService';
import Header from '../components/Header';

interface WeekdayClass {
  morning: ClassInfo[];
  afternoon: ClassInfo[];
  evening: ClassInfo[];
}

interface WeeklySchedule {
  monday: WeekdayClass;
  tuesday: WeekdayClass;
  wednesday: WeekdayClass;
  thursday: WeekdayClass;
  friday: WeekdayClass;
  saturday: WeekdayClass;
  sunday: WeekdayClass;
}

const initialWeekdayState = {
  morning: [],
  afternoon: [],
  evening: []
};

const TeacherSchedulePage = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    monday: initialWeekdayState,
    tuesday: initialWeekdayState,
    wednesday: initialWeekdayState,
    thursday: initialWeekdayState,
    friday: initialWeekdayState,
    saturday: initialWeekdayState,
    sunday: initialWeekdayState
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const data = await teacherService.getTeacherClasses();
        setClasses(data);

        // Organize classes by weekday and time based on real schedule data
        const schedule: WeeklySchedule = {
          monday: { morning: [], afternoon: [], evening: [] },
          tuesday: { morning: [], afternoon: [], evening: [] },
          wednesday: { morning: [], afternoon: [], evening: [] },
          thursday: { morning: [], afternoon: [], evening: [] },
          friday: { morning: [], afternoon: [], evening: [] },
          saturday: { morning: [], afternoon: [], evening: [] },
          sunday: { morning: [], afternoon: [], evening: [] }
        };

        // Helper to determine time slot
        const getTimeSlot = (startTime?: string) => {
          if (!startTime) return 'morning';
          const hour = parseInt(startTime.split(':')[0], 10);
          if (hour < 12) return 'morning';
          if (hour < 18) return 'afternoon';
          return 'evening';
        };

        // Helper to parse Vietnamese weekday to English
        const vi2en: Record<string, string> = {
          'thứ hai': 'monday',
          'thứ ba': 'tuesday',
          'thứ tư': 'wednesday',
          'thứ năm': 'thursday',
          'thứ sáu': 'friday',
          'thứ bảy': 'saturday',
          'chủ nhật': 'sunday',
          'monday': 'monday',
          'tuesday': 'tuesday',
          'wednesday': 'wednesday',
          'thursday': 'thursday',
          'friday': 'friday',
          'saturday': 'saturday',
          'sunday': 'sunday',
        };

        data.forEach(classItem => {
          // Prefer schedule_day if available
          let weekday = '';
          if ((classItem as any).schedule_day) {
            weekday = ((classItem as any).schedule_day || '').toLowerCase();
          } else if (classItem.schedule) {
            const scheduleLower = classItem.schedule.toLowerCase();
            // Ưu tiên tách tiếng Việt
            if (scheduleLower.startsWith('chủ nhật')) {
              weekday = 'chủ nhật';
            } else {
              const matchVi = scheduleLower.match(/thứ [a-záàạảãâầấậẩẫăằắặẳẵéèẹẻẽêềếệểễíìịỉĩóòọỏõôồốộổỗơờớợởỡúùụủũưừứựửữýỳỵỷỹđ]+/);
              if (matchVi) {
                weekday = matchVi[0];
              } else {
                // Nếu không phải tiếng Việt, tách từ đầu chuỗi (trước dấu cách hoặc '(')
                const firstWord = scheduleLower.split(/\s|\(/)[0];
                weekday = firstWord;
              }
            }
          }
          const dayKey = vi2en[weekday] || weekday;
          if (schedule[dayKey as keyof WeeklySchedule]) {
            const timeSlot = getTimeSlot(classItem.start_time);
            schedule[dayKey as keyof WeeklySchedule][timeSlot as keyof WeekdayClass].push(classItem);
          } else {
            // Debug: log classes that could not be assigned
            console.warn('Không xác định được thứ cho lớp:', classItem, 'weekday:', weekday, 'dayKey:', dayKey);
          }
        });
        setWeeklySchedule(schedule);
      } catch (err) {
        setError('Không thể tải lịch giảng dạy. Vui lòng thử lại sau.');
        console.error('Error fetching teacher schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const getWeekDates = () => {
    const dates = [];
    const currentDate = new Date(currentWeek);
    const dayOfWeek = currentDate.getDay();
    
    // Calculate the date of Monday in the current week
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);
    
    // Calculate dates for the entire week
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };
  
  const weekDates = getWeekDates();
  
  const changeWeek = (offset: number) => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (offset * 7));
    setCurrentWeek(newWeek);
  };

  const formatDateHeader = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return (
      <div className={`text-center ${isToday ? 'bg-blue-100 rounded-lg' : ''}`}>
        <div className="text-sm font-medium">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
        </div>
        <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>
          {day}
        </div>
        <div className="text-xs text-gray-500">{month}</div>
      </div>
    );
  };
  
  const weekdayToIndex = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0
  };

  const renderClassItem = (classItem: ClassInfo, dayKey: string, timeSlot: string, idx?: number) => {
    const dayOfWeek = weekdayToIndex[dayKey as keyof typeof weekdayToIndex];
    const currentDate = weekDates[dayOfWeek];
    const isTodaysClass = currentDate.toDateString() === new Date().toDateString();
    // Key duy nhất: nếu có id thì dùng id, nếu không thì dùng idx
    const key = (classItem.id !== undefined && classItem.id !== null)
      ? `${classItem.id}-${dayKey}-${timeSlot}`
      : `noid-${dayKey}-${timeSlot}-${idx}`;
    return (
      <div 
        key={key}
        className={`p-3 rounded-lg mb-2 ${isTodaysClass ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-900">{classItem.name}</h4>
            <p className="text-sm text-gray-600">{classItem.subject}</p>
          </div>
          {isTodaysClass && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Hôm nay
            </span>
          )}
        </div>
        <div className="mt-2 flex justify-between items-center text-sm">
          <div className="text-gray-500">
            <span className="inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {classItem.room}
            </span>
          </div>
          <Link
            to={`/teacher/classes/${(classItem as any).class_id ?? classItem.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            Chi tiết
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                to="/teacher/dashboard" 
                className="text-blue-600 hover:text-blue-800 mr-2"
              >
                Dashboard
              </Link>
              <span className="text-gray-500">/</span>
              <span className="ml-2 text-gray-600">Lịch giảng dạy</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Lịch giảng dạy</h1>
          </div>
        </div>

        {/* Week Selector */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => changeWeek(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-lg font-semibold text-gray-800">
              {`Tuần ${currentWeek.getDate()}/${currentWeek.getMonth() + 1} - ${weekDates[6].getDate()}/${weekDates[6].getMonth() + 1}`}
            </h2>
            
            <button
              onClick={() => changeWeek(1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mt-4">
            {weekDates.map((date, index) => (
              <div key={`date-${index}`} className="text-center">
                {formatDateHeader(date)}
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p>{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* For each day of the week */}
            {Object.entries(weeklySchedule).map(([day, daySchedule]) => (
              <div key={day} className="space-y-4">
                {/* Morning */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 border-b pb-2 mb-2">Sáng</h3>
                  <div className="space-y-2">
                    {daySchedule.morning.length > 0 ? (
                      daySchedule.morning.map((classItem: any, idx: number) => 
                        renderClassItem(classItem, day, 'morning', idx)
                      )
                    ) : (
                      <div className="text-sm text-gray-400 h-16 flex items-center justify-center">
                        <p>Không có lớp</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Afternoon */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 border-b pb-2 mb-2">Chiều</h3>
                  <div className="space-y-2">
                    {daySchedule.afternoon.length > 0 ? (
                      daySchedule.afternoon.map((classItem: any, idx: number) => 
                        renderClassItem(classItem, day, 'afternoon', idx)
                      )
                    ) : (
                      <div className="text-sm text-gray-400 h-16 flex items-center justify-center">
                        <p>Không có lớp</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Evening */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 border-b pb-2 mb-2">Tối</h3>
                  <div className="space-y-2">
                    {daySchedule.evening.length > 0 ? (
                      daySchedule.evening.map((classItem: any, idx: number) => 
                        renderClassItem(classItem, day, 'evening', idx)
                      )
                    ) : (
                      <div className="text-sm text-gray-400 h-16 flex items-center justify-center">
                        <p>Không có lớp</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSchedulePage;
