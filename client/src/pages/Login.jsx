import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import {
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { loginSchema } from '../validations/auth.validation.js'
import { loginUser } from '../services/auth.service.js'
import { useAuth } from '../context/Authcontext.jsx'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data) {
    setServerError('')
    try {
      const res = await loginUser(data)
      login(res.token, res.user)

      if (res.user.role === 'doctor') navigate('/doctor/dashboard')
      else if (res.user.role === 'admin') navigate('/admin/dashboard')
      else navigate('/patient/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data?.needsVerification) {
        navigate('/verify-email', { state: { email: data.email } })
        return
      }
      setServerError(data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <Paper elevation={2} className="w-full max-w-md p-8 rounded-2xl">
        <h1 className="text-2xl font-semibold text-center mb-1">Welcome back</h1>
        <p className="text-gray-500 text-sm text-center mb-6">Login to continue</p>

        {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField
  label="Email or Phone Number"
  autoComplete="username"
  {...register('identifier')}
  error={!!errors.identifier}
  helperText={errors.identifier?.message}
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment>
      ),
    },
  }}
  fullWidth
/>

          <TextField
  label="Password"
  type={showPassword ? 'text' : 'password'}
  autoComplete="current-password"
  {...register('password')}
  error={!!errors.password}
  helperText={errors.password?.message}
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start"><LockIcon fontSize="small" /></InputAdornment>
      ),
      endAdornment: (
        <InputAdornment position="end">
          <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
          </IconButton>
        </InputAdornment>
      ),
    },
  }}
  fullWidth
/>

          <div className="text-right -mt-2">
            <Link to="/forgot-password" className="text-sm text-primary">Forgot password?</Link>
          </div>

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Login'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account? <Link to="/signup" className="text-primary font-medium">Sign Up</Link>
        </p>
      </Paper>
    </div>
  )
}

export default Login