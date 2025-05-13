import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const TestAPIEndpoint: React.FC = () => {
  const [endpoint, setEndpoint] = useState<string>('/teacher/class_attendance_by_date.php');
  const [params, setParams] = useState<string>('classId=1&date=2023-05-15');
  const [responseData, setResponseData] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testAPI = async () => {
    setLoading(true);
    setError('');
    setResponseData('');

    try {
      const url = `${API_BASE_URL}${endpoint}${params ? `?${params}` : ''}`;
      console.log(`Testing API: ${url}`);
      
      const response = await axios.get(url, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      setResponseData(JSON.stringify(response.data, null, 2));
    } catch (err: any) {
      console.error('API Test Error:', err);
      setError(
        `Error: ${err.message}\n` + 
        (err.response 
          ? `Status: ${err.response.status} ${err.response.statusText}\n` +
            `Data: ${JSON.stringify(err.response.data, null, 2)}`
          : 'No response data')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">API Endpoint Tester</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Endpoint (không bao gồm base URL)
        </label>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="/api/endpoint"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tham số (query parameters)
        </label>
        <input
          type="text"
          value={params}
          onChange={(e) => setParams(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          placeholder="param1=value1&param2=value2"
        />
      </div>
      
      <button
        onClick={testAPI}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-blue-300"
      >
        {loading ? 'Đang gửi...' : 'Kiểm tra API'}
      </button>
      
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-1">URL đầy đủ:</p>
        <code className="block bg-gray-100 p-2 rounded-md text-sm">
          {`${API_BASE_URL}${endpoint}${params ? `?${params}` : ''}`}
        </code>
      </div>
      
      {error && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-red-600 mb-1">Lỗi</h3>
          <pre className="bg-red-50 p-4 rounded-md text-red-800 text-sm whitespace-pre-wrap overflow-x-auto">
            {error}
          </pre>
        </div>
      )}
      
      {responseData && (
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-1">Phản hồi thành công</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm whitespace-pre-wrap overflow-x-auto">
            {responseData}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestAPIEndpoint;
