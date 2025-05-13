import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/images/logo.webp';

const TeacherHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? 'bg-blue-700' : '';
  };

  return (
    <nav className="bg-blue-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <img
                className="h-10 w-10"
                src={logo}
                alt="EM_YEU_TRUONG_EM Logo"
                onClick={() => navigate('/teacher')}
              />
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {/* Sidebar Links */}
                <Link
                  to="/teacher"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${
                    location.pathname === '/teacher' ? 'bg-blue-700' : ''
                  }`}
                >
                  Trang chủ
                </Link>

                <Link
                  to="/teacher/classes"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/teacher/classes')}`}
                >
                  Lớp giảng dạy
                </Link>

                <Link
                  to="/teacher/attendance"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/teacher/attendance')}`}
                >
                  Điểm danh
                </Link>

                <Link
                  to="/teacher/schedule"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/teacher/schedule')}`}
                >
                  Lịch dạy
                </Link>

                <Link
                  to="/teacher/quick-attendance"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 ${isActive('/teacher/quick-attendance')}`}
                >
                  Điểm danh nhanh
                </Link>
              </div>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-blue-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>
                </div>

                {/* Dropdown menu */}
                {isProfileOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex={-1}
                  >
                    <div className="block px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">Xin chào!</div>
                      <div className="text-gray-500">{user?.username || 'Giảng viên'}</div>
                    </div>
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Thông tin tài khoản
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="bg-blue-900 inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/teacher"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${
                location.pathname === '/teacher' ? 'bg-blue-700' : ''
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Trang chủ
            </Link>

            <Link
              to="/teacher/classes"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/teacher/classes')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Lớp giảng dạy
            </Link>

            <Link
              to="/teacher/attendance"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/teacher/attendance')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Điểm danh
            </Link>

            <Link
              to="/teacher/schedule"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/teacher/schedule')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Lịch dạy
            </Link>

            <Link
              to="/teacher/quick-attendance"
              className={`block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700 ${isActive('/teacher/quick-attendance')}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Điểm danh nhanh
            </Link>
          </div>

          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">{user?.username || 'Giảng viên'}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/account"
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Thông tin tài khoản
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-blue-700"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TeacherHeader;
