import { createNotification } from '../services/notification.service.js'
import User from '../models/User.model.js'
import Doctor from '../models/Doctor.model.js'
import Appointment from '../models/Appointment.model.js'
import Queue from '../models/Queue.model.js'

export async function getStats(req, res) {
  try {
    const todayStr = new Date().toISOString().split('T')[0]

    const [
      totalDoctors,
      verifiedDoctors,
      pendingDoctors,
      totalPatients,
      appointmentsToday,
      activeQueuesToday,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.countDocuments({ verificationStatus: 'verified' }),
      Doctor.countDocuments({ verificationStatus: 'pending' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments({ date: todayStr }),
      Queue.countDocuments({ date: todayStr, status: { $in: ['waiting', 'called', 'consulting'] } }),
      Appointment.countDocuments({ appointmentStatus: 'completed' }),
      Appointment.countDocuments({ appointmentStatus: 'cancelled' }),
    ])

    res.json({
      success: true,
      stats: {
        totalDoctors,
        verifiedDoctors,
        pendingDoctors,
        totalPatients,
        appointmentsToday,
        activeQueuesToday,
        completedAppointments,
        cancelledAppointments,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// ---- Doctor management ----

export async function getAllDoctorsAdmin(req, res) {
  try {
    const { status } = req.query
    const filter = {}
    if (status) filter.verificationStatus = status

    const doctors = await Doctor.find(filter).populate('user', 'email isBlocked').sort({ createdAt: -1 })
    res.json({ success: true, doctors })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function verifyDoctor(req, res) {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'verified' },
      { new: true }
    )
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
       await createNotification({
      userId: doctor.user,
      type: 'general',
      title: 'Profile Verified ✅',
      message: 'Your doctor profile has been verified and is now visible to patients.',
    })
    res.json({ success: true, message: 'Doctor verified', doctor })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function suspendDoctor(req, res) {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'suspended' },
      { new: true }
    )
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
    res.json({ success: true, message: 'Doctor suspended', doctor })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function activateDoctor(req, res) {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: 'verified' },
      { new: true }
    )
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
    res.json({ success: true, message: 'Doctor activated', doctor })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// ---- Patient management ----

export async function getAllPatients(req, res) {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('-passwordHash -emailOTPHash -resetOTPHash')
      .sort({ createdAt: -1 })
    res.json({ success: true, patients })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function blockUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, message: 'User blocked', user })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function unblockUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, message: 'User unblocked', user })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// ---- Appointments overview ----

export async function getAllAppointmentsAdmin(req, res) {
  try {
    const { status, date } = req.query
    const filter = {}
    if (status) filter.appointmentStatus = status
    if (date) filter.date = date

    const appointments = await Appointment.find(filter)
      .populate('doctor', 'name specialization clinicName')
      .populate('patient', 'name email')
      .sort({ createdAt: -1 })
      .limit(200) // safety limit — bahut zyada records ek saath na aayen

    res.json({ success: true, appointments })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}