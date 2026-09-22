import getRazorpay from '../config/razorpay.js'
import crypto from 'crypto'
import Appointment from '../models/Appointment.model.js'
import Doctor from '../models/Doctor.model.js'
import { createOrderSchema, verifyPaymentSchema } from '../validators/payment.validator.js'
import { createNotification } from '../services/notification.service.js'

// Step 1: Razorpay order banao (amount backend se aata hai, frontend se trust nahi karte)
export async function createOrder(req, res) {
  try {
    const parsed = createOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const appointment = await Appointment.findById(parsed.data.appointmentId)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    if (appointment.paymentStatus === 'payment_paid') {
      return res.status(400).json({ success: false, message: 'This appointment is already paid' })
    }

    // Razorpay amount PAISE mein leta hai, rupees mein nahi — isliye 100 se multiply
    const razorpay = getRazorpay()
    const order = await razorpay.orders.create({
      amount: appointment.amount * 100,
      currency: 'INR',
      receipt: `appt_${appointment._id}`,
    })

    appointment.razorpayOrderId = order.id
    appointment.paymentStatus = 'payment_processing'
    await appointment.save()

    res.json({
      success: true,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      keyId: process.env.RAZORPAY_KEY_ID, // yeh PUBLIC key hai, frontend ko bhejna safe hai
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Could not create payment order' })
  }
}

// Step 2: Payment ke baad Razorpay jo details deta hai, unse SIGNATURE verify karo
export async function verifyPayment(req, res) {
  try {
    const parsed = verifyPaymentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0].message })
    }

    const { appointmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data

    const appointment = await Appointment.findById(appointmentId)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    // ---- ASLI SECURITY CHECK ----
    // Hum khud order_id + payment_id ko apni KEY_SECRET se hash (HMAC-SHA256) karte hain.
    // Agar humara banaya hua hash, Razorpay ke bheje hue signature se MATCH kare,
    // tabhi confirm hota hai ki payment genuine hai aur kisi ne fake data nahi bheja.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      appointment.paymentStatus = 'payment_failed'
      await appointment.save()
      return res.status(400).json({ success: false, message: 'Payment verification failed' })
    }

    appointment.paymentStatus = 'payment_paid'
    appointment.paymentMethod = 'online'
    appointment.razorpayPaymentId = razorpay_payment_id
    await appointment.save()

    await createNotification({
      userId: appointment.patient,
      type: 'payment',
      title: 'Payment Successful',
      message: `Your payment of ₹${appointment.amount} has been received.`,
      relatedAppointment: appointment._id,
    })

    res.json({ success: true, message: 'Payment verified successfully', appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Payment verification failed' })
  }
}

// Doctor "Mark as Paid" — jab patient clinic mein cash de de
export async function markCashPaid(req, res) {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id })
    const appointment = await Appointment.findById(req.params.appointmentId)

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (!doctor || appointment.doctor.toString() !== doctor._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    if (appointment.paymentStatus === 'payment_paid') {
      return res.status(400).json({ success: false, message: 'Already marked as paid' })
    }

    appointment.paymentStatus = 'payment_paid'
    appointment.paymentMethod = 'clinic'
    await appointment.save()

    res.json({ success: true, message: 'Marked as paid', appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// Webhook — Razorpay server-to-server confirm karta hai (extra reliability layer).
// Local development mein iska URL public nahi hota, isliye abhi basic rakha hai —
// production mein deploy karne ke baad Razorpay dashboard mein iska URL register karna hoga.
export async function razorpayWebhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature']
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' })
    }

    const event = req.body.event
    if (event === 'payment.captured') {
      const orderId = req.body.payload.payment.entity.order_id
      const appointment = await Appointment.findOne({ razorpayOrderId: orderId })
      if (appointment && appointment.paymentStatus !== 'payment_paid') {
        appointment.paymentStatus = 'payment_paid'
        await appointment.save()
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false })
  }
}
// Reconciliation — jab frontend ka 'handler' callback miss ho jaaye (netbanking/redirect
// methods mein aisa hota hai), yeh endpoint seedha Razorpay se poochta hai payment ka
// asli status, aur agar paid mila to database update kar deta hai.
export async function checkPaymentStatus(req, res) {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' })
    }
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    // Already paid hai to seedha bata do, Razorpay se dobara poochने ki zaroorat nahi
    if (appointment.paymentStatus === 'payment_paid') {
      return res.json({ success: true, appointment })
    }

    if (!appointment.razorpayOrderId) {
      return res.json({ success: true, appointment })
    }

    const razorpay = getRazorpay()
    // Yeh call server-to-server hai (humari secret key se), isliye is data pe
    // seedha bharosa kar sakte hain — signature check ki zaroorat nahi yahan
    const payments = await razorpay.orders.fetchPayments(appointment.razorpayOrderId)
    const capturedPayment = payments.items.find((p) => p.status === 'captured')

    if (capturedPayment) {
      appointment.paymentStatus = 'payment_paid'
      appointment.paymentMethod = 'online'
      appointment.razorpayPaymentId = capturedPayment.id
      await appointment.save()

      await createNotification({
        userId: appointment.patient,
        type: 'payment',
        title: 'Payment Successful',
        message: `Your payment of ₹${appointment.amount} has been received.`,
        relatedAppointment: appointment._id,
      })
    }

    res.json({ success: true, appointment })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Could not check payment status' })
  }
}