import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { TextField, Button, Alert, CircularProgress, Paper } from '@mui/material'
import { resetPasswordSchema } from '../validations/auth.validation.js'
import { resetPassword } from '../services/auth.service.js'

function ResetPassword() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = location.state?.email

  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) })

  useEffect(() => {
    if (!email) navigate('/forgot-password')
  }, [email, navigate])

  async function onSubmit(data) {
    setServerError('')
    try {
      await resetPassword({ email, otp: data.otp, newPassword: data.newPassword })
      setSuccessMsg('Password reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <Paper elevation={2} className="w-full max-w-md p-8 rounded-2xl">
        <h1 className="text-2xl font-semibold text-center mb-1">Reset Password</h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          Enter the OTP sent to <span className="font-medium">{email}</span>
        </p>

        {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}
        {successMsg && <Alert severity="success" className="mb-4">{successMsg}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField
  label="OTP"
  slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
  {...register('otp')}
  error={!!errors.otp}
  helperText={errors.otp?.message}
  fullWidth
/>
          <TextField
            label="New Password"
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            error={!!errors.newPassword}
            helperText={errors.newPassword?.message}
            fullWidth
          />
          <TextField
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          <Link to="/login" className="text-primary">Back to Login</Link>
        </p>
      </Paper>
    </div>
  )
}

export default ResetPassword