import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { useAuth } from '../context/Authcontext.jsx'
import NotificationBell from './NotificationBell.jsx'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-1.5 text-xl font-extrabold text-primary">
          <LocalHospitalIcon />
          JeevanCare
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-gray-600 text-sm font-medium">
          <Link to="/doctors" className="hover:text-primary transition-colors">Find Doctors</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <Button
                component={Link}
                to={user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'}
                variant="text"
              >
                Dashboard
              </Button>
              <Button variant="outlined" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" variant="text">Login</Button>
              <Button component={Link} to="/signup" variant="contained">Sign Up</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar