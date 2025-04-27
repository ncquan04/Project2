import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LockIcon from '../assets/icons/LockIcon';
import UserIcon from '../assets/icons/UserIcon';
import loginBg from '../assets/login-bg.jpg';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuth();
    
    // State để lưu thông tin đăng nhập
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    
    // Hàm chuyển hướng đến trang phù hợp với vai trò người dùng
    const redirectBasedOnRole = (role: string | undefined) => {
        switch (role) {
            case 'student':
                navigate('/student');
                break;
            case 'teacher':
                navigate('/teacher');
                break;
            case 'admin':
                navigate('/admin');
                break;
            default:
                navigate('/home');
                break;
        }
    };
    
    const handleSubmitLogin = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        
        if (!username || !password) {
            setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
            return;
        }
        
        try {
            const result = await login(username, password);
            
            if (result.success) {
                // Lấy thông tin vai trò từ kết quả đăng nhập và chuyển hướng tương ứng
                redirectBasedOnRole(result.role);
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Đã xảy ra lỗi khi đăng nhập');
            console.error('Login error:', err);
        }
    }

    return (
        <div
            className="w-screen h-screen flex justify-center items-center"
            style={{
                backgroundImage: `url(${loginBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className='w-[60%] h-[60%] bg-white rounded-2xl shadow-lg flex flex-col justify-between items-center pl-16 pr-16 pt-10 pb-10'>
                <span className='text-3xl font-medium text-black'>Đăng nhập</span>
                
                {error && (
                    <div className="w-full p-3 mb-4 text-red-800 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}
                
                <div className='flex flex-col w-full'>
                    <div className='flex flex-col'>
                        <span className='text-lg text-black mr-auto'>Tài khoản</span>
                        <div className='flex flex-row items-center border rounded px-3 py-2 mt-2'>
                            <UserIcon width={20} height={20} className="text-black mr-2" />
                            <input
                                type="text"
                                className="outline-none flex-1 border-b-black text-black ml-2"
                                placeholder="Vui lòng nhập tên đăng nhập"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col'>
                        <span className='text-lg text-black mr-auto mt-8'>Mật khẩu</span>
                        <div className='flex flex-row items-center border rounded px-3 py-2 mt-2'>
                            <LockIcon width={20} height={20} className="text-gray-300 mr-2" />
                            <input
                                type="password"
                                className="outline-none flex-1 border-b-black text-black ml-2"
                                placeholder="Vui lòng nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSubmitLogin(e as any);
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div 
                    className={`w-[60%] h-[10%] rounded-full flex justify-center items-center mt-8 cursor-pointer hover:scale-105 transition-all duration-300 ${isLoading ? 'opacity-60 cursor-not-allowed' : 'opacity-90'}`}
                    onClick={isLoading ? undefined : handleSubmitLogin}
                    style={{
                        background: '-webkit-linear-gradient(left, #00dbde, #00dbde, #fc00ff)',
                    }}
                >
                    <span className='font-semibold text-white'>
                        {isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default LoginPage