import { Route, Routes, BrowserRouter, Navigate } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import { AuthProvider } from './contexts/AuthContext'
import OnboardPage from './pages/OnboardPage'
import HomePage from './pages/HomePage'
import AccountPage from './pages/AccountPage'
import AttendantPage from './pages/AttendantPage'
import StudentDashboard from './pages/StudentDashboard'
import StudentClassesPage from './pages/StudentClassesPage'
import StudentClassAttendancePage from './pages/StudentClassAttendancePage'
import AttendanceHistory from './pages/AttendanceHistory'
import { useAuth } from './contexts/AuthContext'

// Protected Route component to handle authentication
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // If still loading auth state, show nothing or a loader
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check for role-specific access if role is specified
  if (role && user?.role !== role) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<OnboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<div className="p-8 text-center">Bạn không có quyền truy cập trang này</div>} />
          
          {/* Common Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/student">
            <Route index element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute role="student"><StudentClassesPage /></ProtectedRoute>} />
            <Route path="class-attendance/:classId" element={<ProtectedRoute role="student"><StudentClassAttendancePage /></ProtectedRoute>} />
            <Route path="attendance-history" element={<ProtectedRoute role="student"><AttendanceHistory /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute role="student"><div>Profile Page (To be implemented)</div></ProtectedRoute>} />
          </Route>
          
          {/* Teacher Routes */}
          <Route path="/teacher">
            <Route index element={<ProtectedRoute role="teacher"><div>Teacher Dashboard (To be implemented)</div></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute role="teacher"><div>Teacher Classes (To be implemented)</div></ProtectedRoute>} />
            <Route path="attendance/:classId" element={<ProtectedRoute role="teacher"><div>Class Attendance Management (To be implemented)</div></ProtectedRoute>} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin">
            <Route index element={<ProtectedRoute role="admin"><div>Admin Dashboard (To be implemented)</div></ProtectedRoute>} />
            <Route path="students" element={<ProtectedRoute role="admin"><div>Student Management (To be implemented)</div></ProtectedRoute>} />
            <Route path="teachers" element={<ProtectedRoute role="admin"><div>Teacher Management (To be implemented)</div></ProtectedRoute>} />
            <Route path="classes" element={<ProtectedRoute role="admin"><div>Class Management (To be implemented)</div></ProtectedRoute>} />
          </Route>
          
          {/* Legacy Route Support for AttendantPage */}
          <Route path="/attendance" element={<ProtectedRoute><AttendantPage /></ProtectedRoute>} />
          
          {/* Fallback route for any undefined routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
