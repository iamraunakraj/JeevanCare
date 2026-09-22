import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  phone: z.string().trim().min(10, 'Enter a valid 10-digit phone number').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['patient', 'doctor']),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
})

export const otpSchema = z.object({
  otp: z.string().length(6, 'Enter the 6-digit OTP'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
})

export const resetPasswordSchema = z
  .object({
    otp: z.string().length(6, 'Enter the 6-digit OTP'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // error isi field ke neeche dikhega
  })