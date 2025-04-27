import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import homepageBg from '../assets/images/homepage-bg.webp';
import { useAuth } from "../contexts/AuthContext";

const HomePage = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Xác định đường dẫn dựa trên vai trò người dùng
    const getRoleBasedPath = () => {
        if (!user) return '/login';
        
        switch(user.role) {
            case 'student':
                return '/student';
            case 'teacher':
                return '/teacher';
            case 'admin':
                return '/admin';
            default:
                return '/home';
        }
    };

    const handleRoleBasedAction = () => {
        navigate(getRoleBasedPath());
    };

    // Hiển thị tên của nút dựa trên vai trò
    const getButtonLabel = () => {
        if (!isAuthenticated) return 'Đăng nhập để tiếp tục';
        
        switch(user?.role) {
            case 'student':
                return 'Vào trang Sinh viên';
            case 'teacher':
                return 'Vào trang Giảng viên';
            case 'admin':
                return 'Vào trang Quản trị';
            default:
                return 'Đi đến Trang chính';
        }
    };

    return (
        <div className="flex flex-col h-screen">
            <Header/>
            <div className="relative flex-1 overflow-hidden">
                <img
                    src={homepageBg}
                    className="w-full h-full object-cover"
                    alt="Homepage background"
                />
                
                {/* Overlay with welcome message and role-based button */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-white p-6">
                    <h1 className="text-4xl font-bold mb-4">Hệ thống Điểm danh EM YÊU TRƯỜNG EM</h1>
                    <p className="text-xl mb-8">Xin chào {user?.username || 'bạn'}!</p>
                    
                    <button 
                        onClick={handleRoleBasedAction}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-lg transition-colors duration-300"
                    >
                        {getButtonLabel()}
                    </button>
                    
                    {user?.role && (
                        <div className="mt-4 text-center">
                            <p>Bạn đang đăng nhập với vai trò: <span className="font-semibold">{user.role === 'student' ? 'Sinh viên' : user.role === 'teacher' ? 'Giảng viên' : user.role === 'admin' ? 'Quản trị viên' : user.role}</span></p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomePage;