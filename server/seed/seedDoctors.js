import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.model.js'
import Doctor from '../models/Doctor.model.js'
import { hashPassword } from '../utils/password.util.js'

dotenv.config()

// Yeh clearly fictional/mock data hai, sirf testing/demo ke liye —
// asli doctors nahi hain, isliye verified badge sirf dev/demo purpose ke liye hai.
const seedDoctors = [
  {
    name: 'Dr. Rahul Sharma',
    email: 'rahul.sharma.seed@example.com',
    phone: '9000000001',
    specialization: 'Cardiologist',
    qualification: 'MBBS, MD (Cardiology)',
    experience: 12,
    about: 'Specialist in heart care with over a decade of experience treating cardiac patients.',
    consultationFee: 500,
    clinicName: 'ABC Heart Care',
    address: 'Nala More Road',
    area: 'Nala More',
    services: ['ECG', 'Heart Checkup', 'Blood Pressure Consultation'],
  },
  {
    name: 'Dr. Priya Verma',
    email: 'priya.verma.seed@example.com',
    phone: '9000000002',
    specialization: 'Dermatologist',
    qualification: 'MBBS, MD (Dermatology)',
    experience: 8,
    about: 'Skin, hair, and cosmetic dermatology specialist.',
    consultationFee: 400,
    clinicName: 'Glow Skin Clinic',
    address: 'Police line ',
    area: 'Chandwa',
    services: ['Acne Treatment', 'Skin Allergy', 'Hair Fall Consultation'],
  },
  {
    name: 'Dr. Anil Kumar',
    email: 'anil.kumar.seed@example.com',
    phone: '9000000003',
    specialization: 'Orthopedic',
    qualification: 'MBBS, MS (Ortho)',
    experience: 15,
    about: 'Joint and bone specialist, expert in sports injuries.',
    consultationFee: 600,
    clinicName: ' Ara Bone & Joint Clinic',
    address: 'KG Road Crossing',
    area: 'KG Road',
    services: ['Fracture Care', 'Joint Pain', 'Physiotherapy Referral'],
  },
  {
    name: 'Dr. Sneha Gupta',
    email: 'sneha.gupta.seed@example.com',
    phone: '9000000004',
    specialization: 'Gynecologist',
    qualification: 'MBBS, MD (OBG)',
    experience: 10,
    about: 'Womens health and prenatal care specialist.',
    consultationFee: 450,
    clinicName: 'Maa Clinic',
    address: 'ZeroMIle Road',
    area: 'ZeroMIle',
    services: ['Prenatal Checkup', 'PCOS Consultation', 'General Gynae Care'],
  },
  {
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh.seed@example.com',
    phone: '9000000005',
    specialization: 'ENT',
    qualification: 'MBBS, MS (ENT)',
    experience: 9,
    about: 'Ear, nose and throat specialist with modern diagnostic setup.',
    consultationFee: 350,
    clinicName: 'Clear Hearing ENT Clinic',
    address: 'Ramna Road',
    area: 'Ramna',
    services: ['Hearing Test', 'Sinus Treatment', 'Throat Infection'],
  },
  {
    name: 'Dr. Kavita Mishra',
    email: 'kavita.mishra.seed@example.com',
    phone: '9000000006',
    specialization: 'Pediatrician',
    qualification: 'MBBS, MD (Pediatrics)',
    experience: 11,
    about: 'Child specialist, vaccination and growth monitoring expert.',
    consultationFee: 400,
    clinicName: 'Little Stars Childcare',
    address: 'Chandwa Chauraha',
    area: 'Chandwa',
    services: ['Vaccination', 'Growth Monitoring', 'Fever & Infection'],
  },
  {
    name: 'Dr. Manoj Tiwari',
    email: 'manoj.tiwari.seed@example.com',
    phone: '9000000007',
    specialization: 'General Physician',
    qualification: 'MBBS',
    experience: 6,
    about: 'General health consultations for all age groups.',
    consultationFee: 250,
    clinicName: 'City Health Clinic',
    address: 'Pakri Chowk',
    area: 'Pakri',
    services: ['General Checkup', 'Fever Treatment', 'Health Certificate'],
  },
  {
    name: 'Dr. Ritu Chaturvedi',
    email: 'ritu.chaturvedi.seed@example.com',
    phone: '9000000008',
    specialization: 'Dentist',
    qualification: 'BDS, MDS',
    experience: 7,
    about: 'Dental care and cosmetic dentistry.',
    consultationFee: 300,
    clinicName: 'Smile Dental Care',
    address: 'KG Road Road',
    area: 'KG Road',
    services: ['Root Canal', 'Teeth Cleaning', 'Braces Consultation'],
  },
  {
    name: 'Dr. Ashok Pandey',
    email: 'ashok.pandey.seed@example.com',
    phone: '9000000009',
    specialization: 'Neurologist',
    qualification: 'MBBS, DM (Neurology)',
    experience: 14,
    about: 'Brain and nervous system disorder specialist.',
    consultationFee: 700,
    clinicName: 'NeuroCare Ara',
    address: 'Station Road',
    area: 'Station',
    services: ['Migraine Treatment', 'Epilepsy Care', 'Nerve Checkup'],
  },
]

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

function buildSchedule() {
  return DAYS.map((day) => ({
    day,
    isWorking: day !== 'sunday', // sabka Sunday off rakha hai
    startTime: '10:00',
    endTime: '18:00',
  }))
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB for seeding...')

    for (const docData of seedDoctors) {
      const existingUser = await User.findOne({ email: docData.email })
      if (existingUser) {
        console.log(`Skipping ${docData.name} — already exists`)
        continue
      }

      const passwordHash = await hashPassword('Password@123') // seed doctors ka dev-only password

      const user = await User.create({
        name: docData.name,
        email: docData.email,
        phone: docData.phone,
        passwordHash,
        role: 'doctor',
        isEmailVerified: true, // seed data — verification skip kiya
      })

      await Doctor.create({
        user: user._id,
        name: docData.name,
        specialization: docData.specialization,
        qualification: docData.qualification,
        experience: docData.experience,
        about: docData.about,
        consultationFee: docData.consultationFee,
        clinicName: docData.clinicName,
        address: docData.address,
        area: docData.area,
        city: 'Ara',
        phone: docData.phone,
        services: docData.services,
        schedule: buildSchedule(),
        maxPatientsPerDay: 30,
        averageConsultationTime: 10,
        verificationStatus: 'verified', // seed data ko turant dikhane ke liye verified
      })

      console.log(`Created: ${docData.name}`)
    }

    console.log('Seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  }
}

seed()