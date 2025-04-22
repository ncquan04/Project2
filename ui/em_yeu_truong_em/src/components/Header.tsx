import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo.webp';
import { useState } from 'react';
import ArrowDownIcon from '../assets/icons/ArrownDownIcon';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const navigate = useNavigate();
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        setLogoutModalVisible(false);
        await logout();
        navigate('/');
    }

    return (
        <div className="w-full flex flex-row justify-center items-center bg-white">
            <img
                src={logo}
                width={60}
                height={60}
            />
            <div className='flex flex-row items-center w-[60%] h-[30%] pl-20 pr-8'>
                <div 
                    className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer'
                    onClick={() => {
                        navigate('/account')
                    }}
                >
                    Tài khoản
                </div>
                <div 
                    className='text-black text-lg font-semibold hover:text-yellow-500 cursor-pointer ml-8'
                    onClick={() => {
                        navigate('/attendance')
                    }}
                >
                    Điểm danh
                </div>
            </div>
            <div className='relative flex flex-row items-center'>
                <div 
                    className='flex flex-row items-center cursor-pointer'
                    onClick={() => setLogoutModalVisible(!logoutModalVisible)}
                >
                    <span className='text-black text-base font-medium'>Xin chào</span>
                    <span className='text-black text-xl font-bold ml-2'>{user?.full_name}</span>
                    <ArrowDownIcon className='w-4 h-4 ml-2' />
                    
                    {logoutModalVisible && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2 z-10 border border-gray-200 transition-all duration-300 animate-slideDown">
                            <div 
                                className='px-4 py-2 text-black hover:bg-gray-100 cursor-pointer'
                                onClick={() => navigate('/profile')}
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