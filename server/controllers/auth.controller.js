import User from '../models/User.model.js'
import Doctor from '../models/Doctor.model.js'
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

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] })
    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number'
      return res.status(409).json({ success: false, message: `${field} already registered` })
    }

    const passwordHash = await hashPassword(password)

    const otp = generateOTP()
    const otpHash = await hashPassword(otp) // OTP ko bhi bcrypt se hash kiya, password ki tarah

    const user = await User.create({
      name,
      email,
      phone,
      passwordHash,
      role,
      age,
      gender,
      isEmailVerified: false,
      emailOTPHash: otpHash,
      emailOTPExpiry: getOTPExpiry(),
    })

    if (role === 'doctor') {
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

    await sendOTPEmail(email, otp, 'verify')

    // Note: yahan hum token/login NAHI de rahe — pehle email verify karna zaroori hai
    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to continue.',
      email: user.email,
    })
  } catch (error) {
    console.error(error)
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

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' })
    }

    if (!user.emailOTPHash || !user.emailOTPExpiry || user.emailOTPExpiry < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' })
    }

    const isMatch = await comparePassword(otp, user.emailOTPHash)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    user.isEmailVerified = true
    user.emailOTPHash = undefined
    user.emailOTPExpiry = undefined
    await user.save()

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
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' })
    }

    const otp = generateOTP()
    user.emailOTPHash = await hashPassword(otp)
    user.emailOTPExpiry = getOTPExpiry()
    await user.save()

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

    // identifier email ho sakta hai ya phone — dono jagah dhundo
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first',
        needsVerification: true, // frontend isse dekh kar verify-email page pe redirect karega
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

    // Security practice: chahe email exist kare ya na kare, hum wahi generic
    // message bhejte hain — isse attacker yeh find out nahi kar payega
    // ki koi specific email registered hai ya nahi.
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
    const user = await User.findById(req.user.id).select('-passwordHash -emailOTPHash -resetOTPHash')
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}