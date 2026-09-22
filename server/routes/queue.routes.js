import express from 'express'
import {
  getToken,
  getMyTokenStatus,
  cancelToken,
  getDoctorQueue,
  callNextPatient,
  startConsultation,
  completeConsultation,
  markNoShow,
} from '../controllers/queue.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

// Patient routes
router.post('/token', requireAuth, requireRole('patient'), getToken)
router.get('/my-status', requireAuth, requireRole('patient'), getMyTokenStatus)
router.patch('/:id/cancel', requireAuth, requireRole('patient'), cancelToken)

// Doctor routes
router.get('/doctor/list', requireAuth, requireRole('doctor'), getDoctorQueue)
router.post('/doctor/call-next', requireAuth, requireRole('doctor'), callNextPatient)
router.patch('/:id/start', requireAuth, requireRole('doctor'), startConsultation)
router.patch('/:id/complete', requireAuth, requireRole('doctor'), completeConsultation)
router.patch('/:id/no-show', requireAuth, requireRole('doctor'), markNoShow)

export default router