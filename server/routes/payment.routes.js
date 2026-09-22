import express from 'express'
import { createOrder, verifyPayment, markCashPaid, razorpayWebhook, checkPaymentStatus } from '../controllers/payment.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router()

router.post('/create-order', requireAuth, requireRole('patient'), createOrder)
router.post('/verify', requireAuth, requireRole('patient'), verifyPayment)
router.get('/status/:appointmentId', requireAuth, requireRole('patient'), checkPaymentStatus) // yeh line add ki
router.patch('/:appointmentId/mark-paid', requireAuth, requireRole('doctor'), markCashPaid)
router.post('/webhook', razorpayWebhook)

export default router