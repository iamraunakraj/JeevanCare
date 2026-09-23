import express from 'express'
import {
  getMyNotifications,
  getAllMyNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth)

router.get('/my', getMyNotifications)
router.get('/all', getAllMyNotifications)
router.patch('/:id/read', markAsRead)
router.patch('/read-all', markAllAsRead)

export default router