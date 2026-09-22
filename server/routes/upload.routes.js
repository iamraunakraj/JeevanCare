import express from 'express'
import { uploadDoctorPhoto, uploadClinicPhoto } from '../controllers/upload.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'
import { upload } from '../middleware/upload.middleware.js'

const router = express.Router()

router.post('/doctor-photo', requireAuth, requireRole('doctor'), upload.single('image'), uploadDoctorPhoto)
router.post('/clinic-photo', requireAuth, requireRole('doctor'), upload.single('image'), uploadClinicPhoto)

export default router