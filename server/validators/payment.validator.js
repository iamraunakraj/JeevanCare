import { z } from 'zod'

export const createOrderSchema = z.object({
  appointmentId: z.string().min(1),
})

export const verifyPaymentSchema = z.object({
  appointmentId: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})