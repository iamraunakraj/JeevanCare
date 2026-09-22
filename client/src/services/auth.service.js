import api from './api.js'

export async function registerUser(data) {
  const res = await api.post('/auth/register', data)
  return res.data
}

export async function verifyEmailOtp(email, otp) {
  const res = await api.post('/auth/verify-email', { email, otp })
  return res.data
}

export async function resendOtp(email) {
  const res = await api.post('/auth/resend-otp', { email })
  return res.data
}

export async function loginUser(data) {
  const res = await api.post('/auth/login', data)
  return res.data
}

export async function fetchMe() {
  const res = await api.get('/auth/me')
  return res.data
}

export async function forgotPassword(email) {
  const res = await api.post('/auth/forgot-password', { email })
  return res.data
}

export async function resetPassword(data) {
  const res = await api.post('/auth/reset-password', data)
  return res.data
}