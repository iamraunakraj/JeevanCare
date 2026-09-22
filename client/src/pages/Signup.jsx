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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LockIcon from '@mui/icons-material/Lock'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { signupSchema } from '../validations/auth.validation.js'
import { registerUser } from '../services/auth.service.js'

function Signup() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: 'patient' },
  })

  const role = watch('role')

  async function onSubmit(data) {
    setServerError('')
    try {
      const res = await registerUser(data)
      // Signup ke baad seedha login nahi hota — pehle OTP verify karna hoga
      navigate('/verify-email', { state: { email: res.email } })
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-10">
      <Paper elevation={2} className="w-full max-w-md p-8 rounded-2xl">
        <h1 className="text-2xl font-semibold text-center mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Find doctors and book appointments in Ara
        </p>

        {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <ToggleButtonGroup
            value={role}
            exclusive
            fullWidth
            onChange={(e, value) => value && setValue('role', value)}
          >
            <ToggleButton value="patient">I'm a Patient</ToggleButton>
            <ToggleButton value="doctor">I'm a Doctor</ToggleButton>
          </ToggleButtonGroup>

          <TextField
  label="Full Name"
  autoComplete="name"
  {...register('name')}
  error={!!errors.name}
  helperText={errors.name?.message}
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
  label="Email"
  type="email"
  autoComplete="email"
  {...register('email')}
  error={!!errors.email}
  helperText={errors.email?.message}
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment>
      ),
    },
  }}
  fullWidth
/>

          <TextField
  label="Phone Number"
  autoComplete="tel"
  {...register('phone')}
  error={!!errors.phone}
  helperText={errors.phone?.message}
  slotProps={{
    input: {
      startAdornment: (
        <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment>
      ),
    },
  }}
  fullWidth
/>

          <TextField
  label="Password"
  type={showPassword ? 'text' : 'password'}
  autoComplete="new-password"
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

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account? <Link to="/login" className="text-primary font-medium">Login</Link>
        </p>
      </Paper>
    </div>
  )
}

export default Signup