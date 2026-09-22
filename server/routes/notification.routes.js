import express from 'express'
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = express.Router()

router.use(requireAuth) // saare notification routes ke liye login zaroori hai

router.get('/my', getMyNotifications)
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)

export default router