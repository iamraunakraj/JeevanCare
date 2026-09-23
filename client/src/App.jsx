import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout.jsx'
import AdminLayout from './layouts/AdminLayout.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Doctors from './pages/Doctors.jsx'
import DoctorProfile from './pages/DoctorProfile.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import DoctorProfileEdit from './pages/DoctorProfileEdit.jsx'
import BookAppointment from './pages/BookAppointment.jsx'
import PatientAppointments from './pages/PatientAppointments.jsx'
import DoctorAppointments from './pages/DoctorAppointments.jsx'
import GetToken from './pages/GetToken.jsx'
import DoctorQueue from './pages/DoctorQueue.jsx'
import AllNotifications from './pages/AllNotifications.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminDoctors from './pages/admin/AdminDoctors.jsx'
import AdminPatients from './pages/admin/AdminPatients.jsx'
import AdminAppointments from './pages/admin/AdminAppointments.jsx'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctor/:id" element={<DoctorProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor', 'admin']}>
              <AllNotifications />
            </ProtectedRoute>
          }
        />

        <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><PatientAppointments /></ProtectedRoute>} />
        <Route path="/book/:doctorId" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
        <Route path="/token/:doctorId" element={<ProtectedRoute allowedRoles={['patient']}><GetToken /></ProtectedRoute>} />

        <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfileEdit /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorAppointments /></ProtectedRoute>} />
        <Route path="/doctor/queue" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorQueue /></ProtectedRoute>} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/patients" element={<AdminPatients />} />
        <Route path="/admin/appointments" element={<AdminAppointments />} />
      </Route>
    </Routes>
  )
}

export default App