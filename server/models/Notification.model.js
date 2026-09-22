import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'queue', 'payment', 'general'],
      default: 'general',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    relatedQueue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification