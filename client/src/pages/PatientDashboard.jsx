import { Link } from 'react-router-dom'
import { useAuth } from '../context/Authcontext.jsx'
import { Button } from '@mui/material'

function PatientDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
      <p className="text-gray-500 mt-2">Find doctors and manage your appointments.</p>

      <div className="flex gap-3 mt-4 flex-wrap">
        <Button component={Link} to="/doctors" variant="contained">Find Doctors</Button>
        <Button component={Link} to="/patient/appointments" variant="outlined">My Appointments</Button>

      </div>
    </div>
  )
}

export default PatientDashboard