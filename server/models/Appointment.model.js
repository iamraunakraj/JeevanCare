import mongoose from 'mongoose'

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    date: { type: String, required: true },
    time: { type: String },
    tokenNumber: { type: Number },
    appointmentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected', 'no_show'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['payment_pending', 'payment_processing', 'payment_paid', 'payment_failed', 'payment_refunded'],
      default: 'payment_pending',
    },
    // Patient ne kaunsa tareeka chuna — online abhi, ya clinic mein cash
    paymentMethod: {
      type: String,
      enum: ['online', 'clinic'],
      default: 'clinic',
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    amount: { type: Number, required: true },
    reason: { type: String },
    patientDetails: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: String, enum: ['male', 'female', 'other'], required: true },
      phone: { type: String, required: true },
    },
  },
  { timestamps: true }
)

appointmentSchema.index({ doctor: 1, date: 1, time: 1 })
appointmentSchema.index({ patient: 1, date: 1 })

const Appointment = mongoose.model('Appointment', appointmentSchema)

export default Appointment