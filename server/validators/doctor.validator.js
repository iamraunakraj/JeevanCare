import { z } from 'zod'

const scheduleEntrySchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  isWorking: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

export const doctorProfileSchema = z.object({
  specialization: z.string().trim().min(2, 'Specialization is required'),
  qualification: z.string().trim().min(2, 'Qualification is required'),
  experience: z.number().min(0, 'Experience cannot be negative'),
  about: z.string().trim().optional(),
  consultationFee: z.number().min(0, 'Fee cannot be negative'),
  clinicName: z.string().trim().min(2, 'Clinic name is required'),
  address: z.string().trim().min(5, 'Address is required'),
  area: z.string().trim().min(2, 'Area is required'),
  city: z.string().trim().default('Ara'),
  phone: z.string().trim().min(10, 'Enter a valid phone number'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  services: z.array(z.string()).default([]),
  schedule: z.array(scheduleEntrySchema).length(7, 'Schedule must have all 7 days'),
  maxPatientsPerDay: z.number().min(1, 'Must be at least 1'),
  averageConsultationTime: z.number().min(1, 'Must be at least 1 minute'),
})