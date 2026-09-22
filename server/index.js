import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import http from 'http'
import connectDB from './config/db.js'
import { initSocket } from './sockets/index.js'
import authRoutes from './routes/auth.routes.js'
import doctorRoutes from './routes/doctor.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import queueRoutes from './routes/queue.routes.js'
import adminRoutes from './routes/admin.routes.js'
import uploadRoutes from './routes/upload.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import rateLimit from 'express-rate-limit'

connectDB()

const app = express()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // is window mein max 20 requests per IP
  message: { success: false, message: 'Too many attempts. Please try again later.' },
})

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/queues', queueRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

const server = http.createServer(app)
initSocket(server, process.env.CLIENT_URL)

const PORT = process.env.PORT || 5000


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})