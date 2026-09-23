import Queue from '../models/Queue.model.js'

// Race-condition-safe token generation — pehle Phase 6 mein yeh sirf
// queue.controller.js ke andar tha, ab isse ek shared function bana diya
// taaki 'Book Appointment' aur 'Get Token' dono isी ek logic ko use karein.
export async function generateQueueToken({ doctorId, date, patientId, appointmentId }) {
  let queueEntry = null
  let attempts = 0
  const MAX_ATTEMPTS = 5

  while (!queueEntry && attempts < MAX_ATTEMPTS) {
    const lastToken = await Queue.findOne({ doctor: doctorId, date }).sort({ tokenNumber: -1 })
    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1

    try {
      queueEntry = await Queue.create({
        doctor: doctorId,
        date,
        tokenNumber: nextTokenNumber,
        patient: patientId,
        appointment: appointmentId,
        status: 'waiting',
      })
    } catch (err) {
      if (err.code === 11000) {
        attempts++
        continue
      }
      throw err
    }
  }

  return queueEntry // null bhi ho sakta hai agar 5 attempts ke baad bhi fail hua
}