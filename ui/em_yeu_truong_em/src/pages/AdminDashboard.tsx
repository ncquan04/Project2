import React from 'react';
import Header from '../components/Header';

const AdminDashboard: React.FC = () => {
  return (
    <div className="w-screen min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-blue-700">Trang quản trị hệ thống</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/admin/students" className="rounded-lg shadow bg-white hover:bg-blue-50 p-6 flex flex-col items-center transition">
            <span className="text-5xl mb-2">👨‍🎓</span>
            <span className="font-semibold text-lg">Quản lý sinh viên</span>
          </a>
          <a href="/admin/classes" className="rounded-lg shadow bg-white hover:bg-blue-50 p-6 flex flex-col items-center transition">
            <span className="text-5xl mb-2">🏫</span>
            <span className="font-semibold text-lg">Quản lý lớp học</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
