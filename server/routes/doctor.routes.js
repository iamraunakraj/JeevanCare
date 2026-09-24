import express from 'express'
import {
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getDoctors,
  getDoctorById,
  getFilterOptions,
  getSearchSuggestions,
} from '../controllers/doctor.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

router.get('/', getDoctors)
router.get('/filter-options', getFilterOptions)
router.get('/suggestions', getSearchSuggestions) // '/:id' se pehle honi chahiye
router.get('/:id', getDoctorById)

router.get('/me/profile', requireAuth, requireRole('doctor'), getMyDoctorProfile)
router.patch('/me/profile', requireAuth, requireRole('doctor'), updateMyDoctorProfile)

export default router