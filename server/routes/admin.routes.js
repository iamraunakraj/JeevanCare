import express from 'express'
import {
  getStats,
  getAllDoctorsAdmin,
  verifyDoctor,
  suspendDoctor,
  activateDoctor,
  getAllPatients,
  blockUser,
  unblockUser,
  getAllAppointmentsAdmin,
} from '../controllers/admin.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

// Poore router pe ek saath auth + admin-role check laga diya —
// isse har route mein alag-alag likhne ki zaroorat nahi
router.use(requireAuth, requireRole('admin'))

router.get('/stats', getStats)

router.get('/doctors', getAllDoctorsAdmin)
router.patch('/doctors/:id/verify', verifyDoctor)
router.patch('/doctors/:id/suspend', suspendDoctor)
router.patch('/doctors/:id/activate', activateDoctor)

router.get('/patients', getAllPatients)
router.patch('/patients/:id/block', blockUser)
router.patch('/patients/:id/unblock', unblockUser)

router.get('/appointments', getAllAppointmentsAdmin)

export default router