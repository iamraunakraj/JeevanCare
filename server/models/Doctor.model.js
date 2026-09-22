import mongoose from 'mongoose'

const scheduleEntrySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true,
    },
    isWorking: { type: Boolean, default: true },
    startTime: { type: String },
    endTime: { type: String },
  },
  { _id: false }
)

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      // User model se copy — search/display ko fast/simple rakhne ke liye.
      // Signup ke time set hota hai. Agar user apna naam badle to yeh bhi sync karna hoga.
      type: String,
      required: true,
    },
    photo: { type: String },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, required: true },
    experience: { type: Number, default: 0 },
    about: { type: String },
    consultationFee: { type: Number, required: true },
    clinicName: { type: String, required: true },
    address: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true, default: 'Ara' },
    phone: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    services: { type: [String], default: [] },
    schedule: { type: [scheduleEntrySchema], default: [] },
    maxPatientsPerDay: { type: Number, default: 30 },
    averageConsultationTime: { type: Number, default: 10 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'suspended'],
      default: 'pending',
    },
  },
  { timestamps: true }
)

doctorSchema.index({ specialization: 1 })
doctorSchema.index({ city: 1, area: 1 })
doctorSchema.index({ name: 'text', specialization: 'text', clinicName: 'text', area: 'text' })

const Doctor = mongoose.model('Doctor', doctorSchema)

export default Doctor