import User from '../models/User.model.js'
import Doctor from '../models/Doctor.model.js'
import PendingSignup from '../models/PendingSignup.model.js'
import { hashPassword, comparePassword } from '../utils/password.util.js'
import { generateToken } from '../utils/jwt.util.js'
import { generateOTP, getOTPExpiry } from '../utils/otp.util.js'
import { sendOTPEmail } from '../utils/email.util.js'
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validator.js'

export async function register(req, res) {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { name, email, phone, password, role, age, gender } = parsed.data

    // Step 1: Confirm karo koi VERIFIED account isse pehle se nahi bana hua
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] })
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number'
      return res.status(409).json({ success: false, message: `${field} already registered` })
    }

    // Step 2: Agar isी email/phone se koi purana "pending" (unverified) attempt
    // pada hai, use hata do — naya fresh attempt shuru karenge
    await PendingSignup.deleteMany({ $or: [{ email }, { phone }] })

    // Step 3: Password aur OTP hash karke SIRF pending collection mein save karo —
    // asli 'users' collection ko abhi touch hi nahi kiya
    const passwordHash = await hashPassword(password)
    const otp = generateOTP()
    const otpHash = await hashPassword(otp)

    await PendingSignup.create({
      name,
      email,
      phone,
      passwordHash,
      role,
      age,
      gender,
      otpHash,
      otpExpiry: getOTPExpiry(),
    })

    await sendOTPEmail(email, otp, 'verify')

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.',
      email,
    })
  } catch (error) {
    console.error(error)
    // Agar 'pending' collection ka unique-index (email/phone) clash kare
    // (race condition — 2 requests same time pe), user ko friendly message do
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A signup is already in progress for this email. Please try verifying or wait a moment.' })
    }
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' })
  }
}

export async function verifyEmail(req, res) {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { email, otp } = parsed.data

    // Ab hum PENDING collection mein dhundhte hain, User collection mein nahi
    const pending = await PendingSignup.findOne({ email })
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'No pending signup found for this email. Please sign up again.',
      })
    }

    if (pending.otpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' })
    }

    const isMatch = await comparePassword(otp, pending.otpHash)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    // ---- OTP sahi hai — AB asli User account banaya jaayega ----
    const user = await User.create({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      passwordHash: pending.passwordHash,
      role: pending.role,
      age: pending.age,
      gender: pending.gender,
      isEmailVerified: true,
    })

    if (pending.role === 'doctor') {
      await Doctor.create({
        user: user._id,
        name: user.name,
        specialization: 'Not set',
        qualification: 'Not set',
        consultationFee: 0,
        clinicName: 'Not set',
        address: 'Not set',
        area: 'Not set',
        verificationStatus: 'pending',
      })
    }

    // Kaam ho gaya — pending record ab zaroorat nahi, hata do
    await PendingSignup.deleteOne({ _id: pending._id })

    const token = generateToken(user._id, user.role)

    res.json({
      success: true,
      message: 'Email verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function resendOtp(req, res) {
  try {
    const parsed = resendOtpSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { email } = parsed.data
    const pending = await PendingSignup.findOne({ email })
    if (!pending) {
      return res.status(404).json({
        success: false,
        message: 'No pending signup found. Please sign up again.',
      })
    }

    const otp = generateOTP()
    pending.otpHash = await hashPassword(otp)
    pending.otpExpiry = getOTPExpiry()
    await pending.save()

    await sendOTPEmail(email, otp, 'verify')

    res.json({ success: true, message: 'A new OTP has been sent to your email' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function login(req, res) {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { identifier, password } = parsed.data

    const user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] })
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact support.' })
    }

    const isMatch = await comparePassword(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    // Note: Ab har User document verified hi hota hai (kyunki isी waqt banta hai
    // jab OTP verify ho), isliye yeh check ab practically kabhi trigger nahi hoga —
    // lekin defensive coding ke tor pe rakha hai
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true,
        email: user.email,
      })
    }

    const token = generateToken(user._id, user.role)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function forgotPassword(req, res) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { email } = parsed.data
    const user = await User.findOne({ email })

    if (user) {
      const otp = generateOTP()
      user.resetOTPHash = await hashPassword(otp)
      user.resetOTPExpiry = getOTPExpiry()
      await user.save()
      await sendOTPEmail(email, otp, 'reset')
    }

    res.json({
      success: true,
      message: 'If this email is registered, an OTP has been sent to it.',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function resetPassword(req, res) {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { email, otp, newPassword } = parsed.data
    const user = await User.findOne({ email })

    if (!user || !user.resetOTPHash || !user.resetOTPExpiry || user.resetOTPExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' })
    }

    const isMatch = await comparePassword(otp, user.resetOTPHash)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    user.passwordHash = await hashPassword(newPassword)
    user.resetOTPHash = undefined
    user.resetOTPExpiry = undefined
    await user.save()

    res.json({ success: true, message: 'Password reset successfully. Please login.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -resetOTPHash')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}