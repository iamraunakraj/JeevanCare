import { Link } from 'react-router-dom'
import { useAuth } from '../context/Authcontext.jsx'
import { Button } from '@mui/material'

function DoctorDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold">Dr. {user?.name}'s Dashboard</h1>
      <p className="text-gray-500 mt-2">Manage your queue, appointments, and clinic profile.</p>

      <div className="flex gap-3 mt-4 flex-wrap">
        <Button component={Link} to="/doctor/queue" variant="contained">Live Queue</Button>
        <Button component={Link} to="/doctor/appointments" variant="outlined">Appointments</Button>
        <Button component={Link} to="/doctor/profile" variant="outlined">Edit Clinic Profile</Button>
        
      </div>
    </div>
  )
}

export default DoctorDashboard