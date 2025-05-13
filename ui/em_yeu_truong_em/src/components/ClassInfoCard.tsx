import { ClassInfo } from '../services/teacherService';

interface ClassInfoCardProps {
  classInfo: ClassInfo | null;
  loading?: boolean;
}

const ClassInfoCard = ({ classInfo, loading = false }: ClassInfoCardProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin lớp học</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-500">Mã lớp</p>
          <p className="font-medium text-gray-900">#{classInfo.id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Tên lớp</p>
          <p className="font-medium text-gray-900">{classInfo.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Môn học</p>
          <p className="font-medium text-gray-900">{classInfo.subject}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Lịch học</p>
          <p className="font-medium text-gray-900">{classInfo.schedule}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Phòng học</p>
          <p className="font-medium text-gray-900">{classInfo.room}</p>
        </div>
      </div>
    </div>
  );
};

export default ClassInfoCard;