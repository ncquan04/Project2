import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, checkAuth, login as loginApi, logout as logoutApi } from '../services/authService';

// Định nghĩa kiểu dữ liệu cho context
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  error: string | null;
}

// Tạo context với giá trị mặc định
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, message: '' }),
  logout: async () => {},
  error: null,
});

// Custom hook để sử dụng context
export const useAuth = () => useContext(AuthContext);

// Props cho AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Component Provider cung cấp context
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra trạng thái đăng nhập khi component được mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        setIsLoading(true);
        const response = await checkAuth();
        
        if (response.success && response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        setError('Đã xảy ra lỗi khi kiểm tra trạng thái đăng nhập');
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Hàm đăng nhập
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await loginApi(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Đã xảy ra lỗi khi đăng nhập');
      return { success: false, message: 'Đã xảy ra lỗi khi đăng nhập' };
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm đăng xuất
  const logout = async () => {
    try {
      setIsLoading(true);
      const response = await logoutApi();
      
      if (response.success) {
        setUser(null);
        setIsAuthenticated(false);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Đã xảy ra lỗi khi đăng xuất');
    } finally {
      setIsLoading(false);
    }
  };

  // Giá trị cung cấp cho context
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};