import Notification from '../models/Notification.model.js'

// Yeh function har jagah se call hoga jahan bhi hume koi notification banani ho —
// isse duplicate code nahi likhna padta har controller mein
export async function createNotification({ userId, type, title, message, relatedAppointment, relatedQueue }) {
  try {
    await Notification.create({
      user: userId,
      type,
      title,
      message,
      relatedAppointment,
      relatedQueue,
    })
  } catch (error) {
    // Notification fail hone se main operation (jaise appointment booking) fail
    // nahi hona chahiye — isliye error sirf log karte hain, throw nahi karte
    console.error('Failed to create notification:', error)
  }
}