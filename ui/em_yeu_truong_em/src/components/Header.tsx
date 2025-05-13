import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.webp';
import { useState, useEffect } from 'react';
import ArrowDownIcon from '../assets/icons/ArrownDownIcon';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const navigate = useNavigate();
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const { logout, user } = useAuth();
    const [displayName, setDisplayName] = useState('');
    
    useEffect(() => {
        console.log("Header component - Current user object:", user);
        
        if (user) {
            // Kiểm tra trực tiếp đối tượng user
            console.log("User type:", typeof user);
            console.log("User has username property:", Object.prototype.hasOwnProperty.call(user, 'username'));
            
            // Ưu tiên sử dụng username từ user object
            if (user.username) {
                setDisplayName(user.username);
                console.log("Using username from user object:", user.username);
            } else {
                // Fallback nếu không có username
                setDisplayName("Người dùng");
                console.log("No username found in user object, using default");
            }
        } else {
            setDisplayName("Người dùng");
            console.log("No user object, using default name");
        }
    }, [user]);

    const handleLogout = async () => {
        setLogoutModalVisible(false);
        await logout();
        navigate('/');
    }

    // Xác định trang chính theo vai trò của người dùng
    const getRoleDashboardPath = () => {
        if (!user) return '/home';
        
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

    // Lấy nhãn hiển thị cho trang chính
    const getDashboardLabel = () => {
        if (!user) return 'Trang chủ';
        
        switch(user.role) {
            case 'student':
                return 'Trang sinh viên';
            case 'teacher':
                return 'Trang giảng viên';
            case 'admin':
                return 'Trang quản trị';
            default:
                return 'Trang chủ';
        }
    };

    return (
        <div className="w-full flex flex-row justify-center items-center bg-white shadow-md py-2">
            <div 
                className="flex items-center cursor-pointer" 
                onClick={() => navigate('/home')}
            >
                <img
                    src={logo}
                    width={60}
                    height={60}
                    alt="Logo"
                />
            </div>
            <div className='flex flex-row items-center w-[60%] h-[30%] pl-20 pr-8'>
                <div 
                    className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer'
                    onClick={() => {
                        navigate(getRoleDashboardPath());
                    }}
                >
                    {getDashboardLabel()}
                </div>
                <div 
                    className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                    onClick={() => {
                        navigate('/account')
                    }}
                >
                    Tài khoản
                </div>
                {user?.role === 'student' && (
                    <div 
                        className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                        onClick={() => {
                            navigate('/student/classes')
                        }}
                    >
                        Lớp học
                    </div>
                )}
                {user?.role === 'teacher' && (
                    <div 
                        className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                        onClick={() => {
                            navigate('/teacher/classes')
                        }}
                    >
                        Lớp giảng dạy
                    </div>
                )}                {user?.role === 'teacher' && (
                    <>
                        <div 
                            className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                            onClick={() => {
                                navigate('/teacher/attendance')
                            }}
                        >
                            Điểm danh
                        </div>
                        <div 
                            className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                            onClick={() => {
                                navigate('/teacher/schedule')
                            }}
                        >
                            Lịch dạy
                        </div>
                    </>
                )}
                
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <div 
                        className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                        onClick={() => {
                            navigate('/attendance')
                        }}
                    >
                        Điểm danh
                    </div>
                )}
            </div>
            <div className='relative flex flex-row items-center'>
                <div 
                    className='flex flex-row items-center cursor-pointer'
                    onClick={() => setLogoutModalVisible(!logoutModalVisible)}
                >
                    <span className='text-black text-base font-medium'>Xin chào</span>
                    <span className='text-black text-xl font-bold ml-2'>{displayName}</span>
                    <ArrowDownIcon className='w-4 h-4 ml-2' />
                    
                    {logoutModalVisible && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-10 border border-gray-200 transition-all duration-300 animate-slideDown">
                            <div 
                                className='px-4 py-2 text-black hover:bg-gray-100 cursor-pointer'
                                onClick={() => {
                                    setLogoutModalVisible(false);
                                    if (user?.role === 'student') {
                                        navigate('/student/profile');
                                    } else {
                                        navigate('/profile');
                                    }
                                }}
                            >
                                Thông tin cá nhân
                            </div>
                            <div 
                                className='px-4 py-2 text-red-500 hover:bg-gray-100 cursor-pointer'
                                onClick={handleLogout}
                            >
                                Đăng xuất
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Header;