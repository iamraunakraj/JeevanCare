import { z } from 'zod'

const scheduleEntrySchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  isWorking: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export const doctorProfileFormSchema = z.object({
  specialization: z.string().trim().min(2, 'Specialization is required'),
  qualification: z.string().trim().min(2, 'Qualification is required'),
  experience: z.coerce.number().min(0, 'Experience cannot be negative'),
  about: z.string().trim().optional(),
  consultationFee: z.coerce.number().min(0, 'Fee cannot be negative'),
  clinicName: z.string().trim().min(2, 'Clinic name is required'),
  address: z.string().trim().min(5, 'Address is required'),
  area: z.string().trim().min(2, 'Area is required'),
  city: z.string().trim().min(2),
  phone: z.string().trim().min(10, 'Enter a valid phone number'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  servicesText: z.string().optional(),
  schedule: z.array(scheduleEntrySchema),
  maxPatientsPerDay: z.coerce.number().min(1, 'Must be at least 1'),
  averageConsultationTime: z.coerce.number().min(1, 'Must be at least 1 minute'),
})