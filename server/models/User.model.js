import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    isBlocked: { type: Boolean, default: false },

    // Ab yeh field hamesha 'true' rahega, kyunki User document TABHI banta hai
    // jab OTP verify ho chuka ho (dekho verifyEmail controller). Field isliye
    // rakha hai taaki future mein Google-login jaisे koi doosra signup path
    // aaye to woh isse false rakh sake.
    isEmailVerified: { type: Boolean, default: true },

    resetOTPHash: { type: String },
    resetOTPExpiry: { type: Date },
  },
  { timestamps: true }
)

const User = mongoose.model('User', userSchema)

export default User