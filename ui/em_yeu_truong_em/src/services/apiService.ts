import { API_URL, handleSessionExpired } from './authService';

// Định nghĩa kiểu dữ liệu cho các tham số của apiCall
export interface ApiCallOptions extends RequestInit {
  body?: any;
}

/**
 * Hàm gọi API chung cho toàn bộ ứng dụng
 * @param endpoint Endpoint API (không bao gồm base URL)
 * @param options Các tùy chọn cho fetch API
 * @param autoRedirect Có tự động chuyển hướng khi lỗi 401 không (mặc định: true)
 * @returns Promise với dữ liệu trả về từ API đã được parse JSON
 */
export async function apiCall<T>(
  endpoint: string,
  options: ApiCallOptions = {},
  autoRedirect: boolean = true
): Promise<T> {
  try {
    // Đảm bảo endpoint bắt đầu đúng cách
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    // Thiết lập header mặc định
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }
    
    // Tạo đối tượng request
    const requestOptions: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Luôn gửi cookie với request
    };
    
    // Thực hiện gọi API
    const response = await fetch(url, requestOptions);
    
    // Kiểm tra lỗi HTTP
    if (!response.ok) {
      // Đặc biệt xử lý lỗi 401 Unauthorized (phiên hết hạn)
      if (response.status === 401 && autoRedirect) {
        try {
          // Thử đọc dữ liệu JSON để kiểm tra chi tiết lỗi
          const errorData = await response.clone().json();
          
          // Nếu lỗi là do phiên hết hạn, chuyển hướng đến trang đăng nhập
          if (errorData.session_expired || errorData.error === 'Phiên làm việc đã hết hạn') {
            handleSessionExpired();
            throw new Error('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
          }
          
          throw new Error(errorData.message || errorData.error || `Lỗi ${response.status}: ${response.statusText}`);
        } catch (jsonError) {
          // Nếu không thể đọc JSON, giả định là lỗi phiên
          handleSessionExpired();
          throw new Error('Phiên làm việc đã hết hạn, vui lòng đăng nhập lại');
        }
      }
      
      // Các lỗi HTTP khác
      throw new Error(`Lỗi ${response.status}: ${response.statusText}`);
    }
    
    // Đọc và parse dữ liệu JSON
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

/**
 * Hàm tải file từ API
 * @param url URL đến file cần tải
 * @param filename Tên file sau khi tải về
 */
export const downloadFile = (url: string, filename?: string): void => {
  // Tạo thẻ a ẩn để tải file
  const link = document.createElement('a');
  link.href = url;
  
  // Thiết lập tên file nếu có
  if (filename) {
    link.setAttribute('download', filename);
  } else {
    link.setAttribute('download', '');
  }
  
  // Kích hoạt sự kiện click để tải file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};