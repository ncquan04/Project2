// Định nghĩa kiểu dữ liệu cho user
export interface User {
  user_id: number;
  username: string;
  email?: string;
  full_name?: string;
  role?: string;
  role_id?: number;
  role_name?: string;
  student_id?: string;
  rfid_uid?: string;
  class?: string;
  teacher_id?: string;
  department?: string;
}

// Định nghĩa kiểu dữ liệu cho response từ API
export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  role?: string;
  redirect?: string;
}

// URL Backend API
export const API_URL = 'http://localhost/server_diem_danh/api';

/**
 * Hàm đăng nhập
 * @param username Tên đăng nhập
 * @param password Mật khẩu
 * @returns Promise<AuthResponse>
 */
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Đang gửi yêu cầu đăng nhập tới:', `${API_URL}/auth_api.php?action=login`);
    
    const response = await fetch(`${API_URL}/auth_api.php?action=login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    if (!response.ok) {
      console.error('Server response not OK:', response.status, response.statusText);
      return {
        success: false,
        message: `Lỗi máy chủ: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Kiểm tra và xử lý dữ liệu user
    if (data.success && data.user) {
      console.log('User data from API:', data.user);
      
      // Đảm bảo User object có đủ thông tin cần thiết
      const processedUser: User = {
        user_id: data.user.user_id,
        username: data.user.username,
        role: data.role || data.user.role, // Lấy role từ data.role hoặc data.user.role
        student_id: data.user.student_id
      };
      
      console.log('Processed user object:', processedUser);
      
      // Trả về đối tượng mới với user đã xử lý
      return {
        success: data.success,
        message: data.message,
        user: processedUser,
        role: data.role,
        redirect: data.redirect
      };
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: `Đã xảy ra lỗi khi kết nối đến máy chủ: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

/**
 * Hàm kiểm tra trạng thái đăng nhập
 * @returns Promise<AuthResponse>
 */
export const checkAuth = async (): Promise<AuthResponse> => {
  try {
    // Sử dụng auth_status.php để kiểm tra trạng thái đăng nhập
    const response = await fetch(`${API_URL}/auth_status.php`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await response.json();
    // Chuẩn hóa kết quả cho context
    if ((data.success || data.loggedIn) && data.user) {
      return { success: true, user: data.user, role: data.user.role, message: data.message || '' };
    }
    return { success: false, message: data.message || 'Chưa đăng nhập' };
  } catch (error) {
    console.error('Check auth error:', error);
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi kiểm tra trạng thái đăng nhập'
    };
  }
};

/**
 * Hàm đăng xuất
 * @returns Promise<AuthResponse>
 */
export const logout = async (): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth_api.php?action=logout`, {
      method: 'POST',
      credentials: 'include', // Cho phép gửi và nhận cookies
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi đăng xuất'
    };
  }
};

/**
 * Hàm đăng ký tài khoản
 * @param userData Thông tin người dùng đăng ký
 * @returns Promise<AuthResponse>
 */
export const register = async (userData: {
  username: string;
  password: string;
  email: string;
  full_name: string;
  role_id?: number;
}): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth_api.php?action=register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký tài khoản'
    };
  }
};

/**
 * Hàm thay đổi mật khẩu
 * @param userId ID người dùng
 * @param currentPassword Mật khẩu hiện tại
 * @param newPassword Mật khẩu mới
 * @returns Promise<AuthResponse>
 */
export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_URL}/auth_api.php?action=change_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        current_password: currentPassword,
        new_password: newPassword,
      }),
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: 'Đã xảy ra lỗi khi thay đổi mật khẩu'
    };
  }
};