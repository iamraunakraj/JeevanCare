import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true, // ab phone se bhi login hoga, isliye yeh bhi unique hona chahiye
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    age: { type: Number },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ---- Email verification fields ----
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailOTPHash: {
      type: String, // OTP ko bhi hash karke store karte hain, plain text nahi
    },
    emailOTPExpiry: {
      type: Date,
    },

    // ---- Forgot password fields ----
    resetOTPHash: {
      type: String,
    },
    resetOTPExpiry: {
      type: Date,
    },
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User