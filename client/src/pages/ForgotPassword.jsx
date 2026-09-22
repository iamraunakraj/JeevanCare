import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { TextField, Button, Alert, CircularProgress, Paper } from '@mui/material'
import { forgotPasswordSchema } from '../validations/auth.validation.js'
import { forgotPassword } from '../services/auth.service.js'

function ForgotPassword() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data) {
    setServerError('')
    try {
      await forgotPassword(data.email)
      navigate('/reset-password', { state: { email: data.email } })
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <Paper elevation={2} className="w-full max-w-md p-8 rounded-2xl">
        <h1 className="text-2xl font-semibold text-center mb-1">Forgot Password</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Enter your email and we'll send you an OTP
        </p>

        {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField
            label="Email"
            autoComplete="email"
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link to="/login" className="text-primary">Back to Login</Link>
        </p>
      </Paper>
    </div>
  )
}

export default ForgotPassword