import mongoose from 'mongoose'

const queueSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: String, // "2026-08-30" — is date ke liye yeh token hai
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment', // optional link — agar token appointment se juda hai
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'consulting', 'completed', 'cancelled', 'no_show'],
      default: 'waiting',
    },
    calledAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
)

// SABSE IMPORTANT LINE: Yeh compound unique index ensure karta hai
// ki ek doctor ke ek date ke liye same token number DO BAAR kabhi na bane.
// Agar do requests same time pe aayen (race condition), MongoDB khud
// doosri request ko reject kar dega duplicate key error ke saath.
queueSchema.index({ doctor: 1, date: 1, tokenNumber: 1 }, { unique: true })

const Queue = mongoose.model('Queue', queueSchema)

export default Queue