import mongoose from 'mongoose'

// Yeh temporary "waiting room" hai — jab tak user OTP verify nahi karta,
// uska data yahan padta hai, asli 'users' collection mein NAHI jaata.
const pendingSignupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
    age: { type: Number },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    otpHash: { type: String, required: true },
    otpExpiry: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  }
)

// TTL index — yeh record 15 minute baad AUTOMATICALLY delete ho jaayega,
// chahe user verify kare ya na kare. Isse "pending" collection kabhi bhi
// purane/junk records se bhara nahi rahega.
pendingSignupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }) // 900 sec = 15 min

const PendingSignup = mongoose.model('PendingSignup', pendingSignupSchema)

export default PendingSignup