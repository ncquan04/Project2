import axios from 'axios';

// Cấu hình mặc định cho tất cả các request Axios
axios.defaults.withCredentials = true;  // Gửi cookie trong các request để duy trì phiên làm việc

// Set common headers for all requests
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Interceptor xử lý trước khi gửi request
axios.interceptors.request.use(
  config => {
    console.log(`Sending request to: ${config.url}`);
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor xử lý kết quả trả về
axios.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Xử lý các lỗi phổ biến
    if (error.response) {
      // Lỗi từ phía server với mã trạng thái
      console.error(`Error ${error.response.status}: ${error.response.data.error || 'Unknown error'}`);
    } else if (error.request) {
      // Request đã gửi nhưng không nhận được response
      console.error('Server không phản hồi hoặc không thể kết nối đến server');
    } else {
      // Lỗi khi thiết lập request
      console.error('Lỗi: ', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axios;