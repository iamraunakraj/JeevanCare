import { z } from 'zod'

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  reason: z.string().trim().optional(),
  paymentMethod: z.enum(['online', 'clinic']).default('clinic'), // yeh line add ki
  patientDetails: z.object({
    name: z.string().trim().min(2, 'Name is required'),
    age: z.number().min(0).max(120),
    gender: z.enum(['male', 'female', 'other']),
    phone: z.string().trim().min(10, 'Enter a valid phone number'),
  }),
})