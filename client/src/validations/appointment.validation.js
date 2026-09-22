import { z } from 'zod'

export const patientDetailsSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  age: z.coerce.number().min(0, 'Enter a valid age').max(120),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().trim().min(10, 'Enter a valid phone number'),
  reason: z.string().trim().optional(),
})