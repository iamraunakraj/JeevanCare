import Queue from '../models/Queue.model.js'

// Race-condition-safe token generation — yeh function ab Queue controller
// (walk-in token) aur Appointment controller (auto-token on booking) dono
// se use hoga, taaki logic duplicate na ho.
export async function generateTokenForDoctor(doctorId, date, patientId, appointmentId = null) {
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

  return queueEntry
}