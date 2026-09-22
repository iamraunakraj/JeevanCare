import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(10, 'Enter a valid 10-digit phone number').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'doctor']).default('patient'),
  age: z.number().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
})

export const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

export const resendOtpSchema = z.object({
  email: z.string().trim().email(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
})