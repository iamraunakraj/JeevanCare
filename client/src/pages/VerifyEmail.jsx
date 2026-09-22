import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TextField, Button, Alert, CircularProgress, Paper } from '@mui/material'
import { otpSchema } from '../validations/auth.validation.js'
import { verifyEmailOtp, resendOtp } from '../services/auth.service.js'
import { useAuth } from '../context/Authcontext.jsx'

function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const email = location.state?.email

  const [serverError, setServerError] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(otpSchema) })

  // Agar koi seedha /verify-email URL pe aa jaaye bina email ke (state missing),
  // use signup pe wapas bhej do
  useEffect(() => {
    if (!email) navigate('/signup')
  }, [email, navigate])

  // Resend button ke liye 60-second cooldown timer
  useEffect(() => {
    if (cooldown === 0) return
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  async function onSubmit(data) {
    setServerError('')
    try {
      const res = await verifyEmailOtp(email, data.otp)
      login(res.token, res.user)
      navigate(res.user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Invalid OTP')
    }
  }

  async function handleResend() {
    setResendMsg('')
    setServerError('')
    try {
      await resendOtp(email)
      setResendMsg('A new OTP has been sent to your email')
      setCooldown(60)
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4">
      <Paper elevation={2} className="w-full max-w-md p-8 rounded-2xl text-center">
        <h1 className="text-2xl font-semibold mb-1">Verify your email</h1>
        <p className="text-gray-500 text-sm mb-6">
          We've sent a 6-digit code to <span className="font-medium">{email}</span>
        </p>

        {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}
        {resendMsg && <Alert severity="success" className="mb-4">{resendMsg}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField
  label="Enter OTP"
  slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric' } }}
  {...register('otp')}
  error={!!errors.otp}
  helperText={errors.otp?.message}
  fullWidth
/>
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Verify'}
          </Button>
        </form>

        <Button
          variant="text"
          className="mt-4"
          disabled={cooldown > 0}
          onClick={handleResend}
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP'}
        </Button>
      </Paper>
    </div>
  )
}

export default VerifyEmail