import Appointment from '../models/Appointment.model.js'
import Queue from '../models/Queue.model.js'
import Doctor from '../models/Doctor.model.js'
import { getDayName } from '../utils/slot.util.js'
import { getTokenSchema } from '../validators/queue.validator.js'
import { emitQueueEvent } from '../sockets/index.js'
import { generateQueueToken } from '../services/queue.service.js'
import { createNotification } from '../services/notification.service.js'

export async function getToken(req, res) {
  try {
    const parsed = getTokenSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }
    const { doctorId, date, reason, patientDetails, paymentMethod } = parsed.data

    const doctor = await Doctor.findById(doctorId)
    if (!doctor || doctor.verificationStatus !== 'verified') {
      return res.status(404).json({ success: false, message: 'Doctor not available' })
    }

    const dayName = getDayName(date)
    const scheduleEntry = doctor.schedule.find((entry) => entry.day === dayName)
    if (!scheduleEntry || !scheduleEntry.isWorking) {
      return res.status(400).json({ success: false, message: 'Doctor is not available on this date' })
    }

    const existingToken = await Queue.findOne({
      doctor: doctorId,
      date,
      patient: req.user.id,
      status: { $in: ['waiting', 'called', 'consulting'] },
    })
    if (existingToken) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active token for this doctor today',
        queueEntry: existingToken,
      })
    }

    const activeCount = await Queue.countDocuments({
      doctor: doctorId,
      date,
      status: { $ne: 'cancelled' },
    })
    if (activeCount >= doctor.maxPatientsPerDay) {
      return res.status(400).json({ success: false, message: 'Queue is full for today. Please try another date.' })
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time: 'Walk-in',
      reason,
      patientDetails,
      amount: doctor.consultationFee,
      appointmentStatus: 'confirmed',
      paymentStatus: 'payment_pending',
      paymentMethod,
    })

    const queueEntry = await generateQueueToken({
      doctorId,
      date,
      patientId: req.user.id,
      appointmentId: appointment._id,
    })

    if (!queueEntry) {
      await Appointment.findByIdAndDelete(appointment._id)
      return res.status(500).json({ success: false, message: 'Could not generate token. Please try again.' })
    }

    appointment.tokenNumber = queueEntry.tokenNumber
    await appointment.save()

    emitQueueEvent(doctorId, date, 'queue:updated')

    // ---- NAYA: Patient ko confirmation, aur Doctor ko naya token aane ki notification ----
    await createNotification({
      userId: req.user.id,
      type: 'queue',
      title: 'Token Confirmed',
      message: `Your token #${queueEntry.tokenNumber} for ${doctor.name} has been generated.`,
      relatedQueue: queueEntry._id,
    })

    await createNotification({
      userId: doctor.user,
      type: 'queue',
      title: 'New Token Generated',
      message: `${patientDetails.name} has taken token #${queueEntry.tokenNumber} for today.`,
      relatedQueue: queueEntry._id,
    })

    res.status(201).json({ success: true, message: 'Token generated', queueEntry, appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function getMyTokenStatus(req, res) {
  try {
    const { doctorId, date } = req.query
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, message: 'doctorId and date are required' })
    }

    const myToken = await Queue.findOne({
      doctor: doctorId,
      date,
      patient: req.user.id,
      status: { $in: ['waiting', 'called', 'consulting'] },
    })

    if (!myToken) {
      return res.json({ success: true, token: null })
    }

    const doctor = await Doctor.findById(doctorId)

    const currentServing = await Queue.findOne({
      doctor: doctorId,
      date,
      status: { $in: ['called', 'consulting'] },
    }).sort({ tokenNumber: 1 })

    const patientsAhead = await Queue.countDocuments({
      doctor: doctorId,
      date,
      status: 'waiting',
      tokenNumber: { $lt: myToken.tokenNumber },
    })

    const estimatedWait = patientsAhead * (doctor?.averageConsultationTime || 10)

    res.json({
      success: true,
      token: myToken,
      currentToken: currentServing?.tokenNumber || null,
      patientsAhead,
      estimatedWait,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function cancelToken(req, res) {
  try {
    const queueEntry = await Queue.findById(req.params.id)
    if (!queueEntry) {
      return res.status(404).json({ success: false, message: 'Token not found' })
    }
    if (queueEntry.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    if (queueEntry.status !== 'waiting') {
      return res.status(400).json({ success: false, message: 'This token cannot be cancelled now' })
    }

    queueEntry.status = 'cancelled'
    await queueEntry.save()

    if (queueEntry.appointment) {
      await Appointment.findByIdAndUpdate(queueEntry.appointment, { appointmentStatus: 'cancelled' })
    }

    emitQueueEvent(queueEntry.doctor.toString(), queueEntry.date, 'queue:cancelled')

    res.json({ success: true, message: 'Token cancelled', queueEntry })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function getDoctorQueue(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    const { date } = req.query
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' })
    }

    const queue = await Queue.find({ doctor: doctor._id, date })
      .populate('patient', 'name phone')
      .sort({ tokenNumber: 1 })

    res.json({ success: true, queue })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function callNextPatient(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
    const { date } = req.body
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' })
    }

    const activeOne = await Queue.findOne({
      doctor: doctor._id,
      date,
      status: { $in: ['called', 'consulting'] },
    })
    if (activeOne) {
      return res.status(400).json({
        success: false,
        message: 'Please complete or mark no-show for the current patient first',
      })
    }

    const next = await Queue.findOne({ doctor: doctor._id, date, status: 'waiting' }).sort({ tokenNumber: 1 })
    if (!next) {
      return res.status(404).json({ success: false, message: 'No waiting patients in queue' })
    }

    next.status = 'called'
    next.calledAt = new Date()
    await next.save()

    emitQueueEvent(doctor._id.toString(), date, 'queue:called')

    await createNotification({
      userId: next.patient,
      type: 'queue',
      title: "You're being called!",
      message: `Please reach the clinic now. Your token #${next.tokenNumber} is being called.`,
      relatedQueue: next._id,
    })

    res.json({ success: true, message: 'Next patient called', queueEntry: next })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

async function findOwnedQueueEntry(req) {
  const doctor = await Doctor.findOne({ user: req.user.id })
  const entry = await Queue.findById(req.params.id)
  if (!entry || !doctor || entry.doctor.toString() !== doctor._id.toString()) {
    return null
  }
  return entry
}

export async function startConsultation(req, res) {
  try {
    const entry = await findOwnedQueueEntry(req)
    if (!entry) return res.status(404).json({ success: false, message: 'Queue entry not found' })
    if (entry.status !== 'called') {
      return res.status(400).json({ success: false, message: 'Patient must be called first' })
    }

    entry.status = 'consulting'
    entry.startedAt = new Date()
    await entry.save()

    emitQueueEvent(entry.doctor.toString(), entry.date, 'queue:started')

    res.json({ success: true, message: 'Consultation started', queueEntry: entry })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function completeConsultation(req, res) {
  try {
    const entry = await findOwnedQueueEntry(req)
    if (!entry) return res.status(404).json({ success: false, message: 'Queue entry not found' })
    if (!['called', 'consulting'].includes(entry.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' })
    }

    entry.status = 'completed'
    entry.completedAt = new Date()
    await entry.save()

    // Linked Appointment ko bhi 'completed' kar do — dono taraf se sync
    if (entry.appointment) {
      await Appointment.findByIdAndUpdate(entry.appointment, { appointmentStatus: 'completed' })

      await createNotification({
        userId: entry.patient,
        type: 'appointment',
        title: 'Consultation Completed',
        message: 'Your appointment has been marked as completed. We hope you feel better soon!',
        relatedAppointment: entry.appointment,
      })
    }

    emitQueueEvent(entry.doctor.toString(), entry.date, 'queue:completed')

    res.json({ success: true, message: 'Consultation completed', queueEntry: entry })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function markNoShow(req, res) {
  try {
    const entry = await findOwnedQueueEntry(req)
    if (!entry) return res.status(404).json({ success: false, message: 'Queue entry not found' })
    if (!['waiting', 'called'].includes(entry.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status transition' })
    }

    entry.status = 'no_show'
    await entry.save()

    // Linked Appointment ko bhi 'no_show' kar do — dono taraf se sync
    if (entry.appointment) {
      await Appointment.findByIdAndUpdate(entry.appointment, { appointmentStatus: 'no_show' })
    }

    emitQueueEvent(entry.doctor.toString(), entry.date, 'queue:updated')

    res.json({ success: true, message: 'Marked as no-show', queueEntry: entry })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}