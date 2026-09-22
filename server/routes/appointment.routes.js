import express from 'express'
import {
  getAvailableSlots,
  createAppointment,
  getMyAppointments,
  cancelAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
} from '../controllers/appointment.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/slots/:doctorId', getAvailableSlots)
router.post('/', requireAuth, requireRole('patient'), createAppointment)
router.get('/my', requireAuth, requireRole('patient'), getMyAppointments)
router.patch('/:id/cancel', requireAuth, requireRole('patient'), cancelAppointment)

router.get('/doctor/list', requireAuth, requireRole('doctor'), getDoctorAppointments)
router.patch('/:id/status', requireAuth, requireRole('doctor'), updateAppointmentStatus)

export default router