import { Route, Routes, BrowserRouter } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import { AuthProvider } from './contexts/AuthContext'
import OnboardPage from './pages/OnboardPage'
import HomePage from './pages/HomePage'
import AccountPage from './pages/AccountPage'
import AttendantPage from './pages/AttendantPage'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<OnboardPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/home' element={<HomePage />} />
          <Route path='/account' element={<AccountPage />} />
          <Route path='/attendance' element={<AttendantPage />} />
          {/* Add more routes as needed */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
