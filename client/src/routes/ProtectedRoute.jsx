import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/Authcontext.jsx'
import { CircularProgress, Box } from '@mui/material'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  // Jab tak humein pata nahi ki user logged-in hai ya nahi
  // (fetchMe abhi chal raha hai), tab tak loading spinner dikhao
  if (loading) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // allowedRoles diya gaya hai aur user ka role usme nahi hai
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute