import mongoose from 'mongoose'
import dotenv from 'dotenv'
import readline from 'readline'
import User from '../models/User.model.js'
import { hashPassword } from '../utils/password.util.js'

dotenv.config()

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve))
}

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const name = await ask('Admin Name: ')
    const email = await ask('Admin Email: ')
    const phone = await ask('Admin Phone: ')
    const password = await ask('Admin Password (min 6 chars): ')

    const existing = await User.findOne({ email })
    if (existing) {
      console.log('A user with this email already exists.')
      process.exit(1)
    }

    const passwordHash = await hashPassword(password)

    await User.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'admin',
      isEmailVerified: true, // admin ko OTP verify karne ki zaroorat nahi
    })

    console.log(`Admin account created successfully for ${email}`)
    process.exit(0)
  } catch (error) {
    console.error('Failed to create admin:', error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

createAdmin()