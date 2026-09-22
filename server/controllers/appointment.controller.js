import { createNotification } from '../services/notification.service.js'
import Appointment from '../models/Appointment.model.js'
import Doctor from '../models/Doctor.model.js'
import Queue from '../models/Queue.model.js'
import { generateSlots, getDayName } from '../utils/slot.util.js'
import { createAppointmentSchema } from '../validators/appointment.validator.js'
import { generateTokenForDoctor } from '../services/tokenGenerator.service.js'

// Public — ek doctor ke ek din ke available slots dikhata hai
export async function getAvailableSlots(req, res) {
  try {
    const { doctorId } = req.params
    const { date } = req.query

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' })
    }

    const doctor = await Doctor.findById(doctorId)
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' })
    }

    const dayName = getDayName(date)
    const scheduleEntry = doctor.schedule.find((entry) => entry.day === dayName)
    const allSlots = generateSlots(scheduleEntry, doctor.averageConsultationTime, date)

    // Jo slots already book ho chuke hain (pending/confirmed appointments), unhe hata do
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      date,
      appointmentStatus: { $in: ['pending', 'confirmed'] },
    }).select('time')

    const bookedTimes = new Set(bookedAppointments.map((a) => a.time))
    const availableSlots = allSlots.filter((slot) => !bookedTimes.has(slot))

    res.json({ success: true, slots: availableSlots })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}
export async function createAppointment(req, res) {
  try {
    const parsed = createAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { doctorId, date, time, reason, patientDetails, paymentMethod } = parsed.data

    const doctor = await Doctor.findById(doctorId)
    if (!doctor || doctor.verificationStatus !== 'verified') {
      return res.status(404).json({ success: false, message: 'Doctor not available for booking' })
    }

    const dayName = getDayName(date)
    const scheduleEntry = doctor.schedule.find((entry) => entry.day === dayName)
    const validSlots = generateSlots(scheduleEntry, doctor.averageConsultationTime, date)

    if (!validSlots.includes(time)) {
      return res.status(400).json({ success: false, message: 'This slot is not available' })
    }

    const existing = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      appointmentStatus: { $in: ['pending', 'confirmed'] },
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'This slot has just been booked by someone else. Please choose another.',
      })
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time,
      reason,
      patientDetails,
      amount: doctor.consultationFee,
      appointmentStatus: 'confirmed',
      paymentStatus: 'payment_pending',
      paymentMethod, // yeh line add ki
    })

    await createNotification({
      userId: doctor.user,
      type: 'appointment',
      title: 'New Appointment Booked',
      message: `${patientDetails.name} booked an appointment on ${date} at ${time}.`,
      relatedAppointment: appointment._id,
    })
    //chatgpt se 
    
    //itni door patient appoint k liye

    res.status(201).json({ success: true, message: 'Appointment booked successfully', appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// Patient apne saare appointments dekhta hai
export async function getMyAppointments(req, res) {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialization clinicName area photo')
      .sort({ date: -1, time: -1 })

    res.json({ success: true, appointments })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function cancelAppointment(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.id)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Sirf apna hi appointment cancel kar sake — dusre ka ID daal kar nahi
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    if (['completed', 'cancelled', 'no_show'].includes(appointment.appointmentStatus)) {
      return res.status(400).json({ success: false, message: 'This appointment cannot be cancelled' })
    }

    appointment.appointmentStatus = 'cancelled'
    await appointment.save()

    res.json({ success: true, message: 'Appointment cancelled', appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// Doctor apne appointments dekhta hai (date se filter kar sakta hai)
export async function getDoctorAppointments(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const { date } = req.query
    const filter = { doctor: doctor._id }
    if (date) filter.date = date

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name email')
      .sort({ time: 1 })

    res.json({ success: true, appointments })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// Doctor appointment ka status update kare (completed / no-show)
export async function updateAppointmentStatus(req, res) {
  try {
    const { status } = req.body
    const allowedStatuses = ['completed', 'no_show', 'rejected', 'cancelled']

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' })
    }

    const doctor = await Doctor.findOne({ user: req.user.id })
    const appointment = await Appointment.findById(req.params.id)

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }

    // Doctor sirf apne hi clinic ke appointments update kar sake
    if (appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    appointment.appointmentStatus = status
    await appointment.save()
    if (status === 'completed') {
  await createNotification({
    userId: appointment.patient,
    type: 'appointment',
    title: 'Consultation Completed',
    message: 'Your appointment has been marked as completed. We hope you feel better soon!',
    relatedAppointment: appointment._id,
  })
}

    res.json({ success: true, message: 'Appointment updated', appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

