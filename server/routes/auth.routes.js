import express from 'express'
import {
  register,
  login,
  getMe,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify-email', verifyEmail)
router.post('/resend-otp', resendOtp)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/me', requireAuth, getMe)

export default router