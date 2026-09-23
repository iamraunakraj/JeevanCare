// import nodemailer from 'nodemailer'

// // Transporter ab function ke ANDAR banate hain, top-level pe nahi.
// // Isse yeh sirf tab banega jab actually email bhejni hogi — 
// // tab tak dotenv.config() already chal chuka hoga aur env variables load ho chuke honge.
// function getTransporter() {
//   return nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   })
// }

// export async function sendOTPEmail(toEmail, otp, purpose = 'verify') {
//   const subject = purpose === 'reset' ? 'Reset your JeevanCare password' : 'Verify your JeevanCare account'
//   const heading = purpose === 'reset' ? 'Password Reset Code' : 'Email Verification Code'

//   const transporter = getTransporter()

//   await transporter.sendMail({
//     from: `"JeevanCare" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject,
//     html: `
//       <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 20px;">
//         <h2 style="color: #0d6efd;">${heading}</h2>
//         <p>Your OTP code is:</p>
//         <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${otp}</p>
//         <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
//       </div>
//     `,
//   })
// }

import nodemailer from 'nodemailer'

const APP_NAME = 'JeevanCare' // apne project ka naam rakh lo

// Brevo se email bhejna — HTTPS API, isliye Render pe block nahi hota
async function sendViaBrevo({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: APP_NAME, email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Brevo error ${res.status}: ${text}`)
  }
}

// Gmail SMTP — sirf local ke liye (Render free pe kaam nahi karega)
async function sendViaGmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_APP_PASSWORD },
  })
  await transporter.sendMail({ from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`, to, subject, html })
}

export async function sendOTPEmail(toEmail, otp, purpose = 'verify') {
  const subject = purpose === 'reset' ? `Reset your ${APP_NAME} password` : `Verify your ${APP_NAME} account`
  const heading = purpose === 'reset' ? 'Password Reset Code' : 'Email Verification Code'

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 20px;">
      <h2 style="color: #0d6efd;">${heading}</h2>
      <p>Your OTP code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${otp}</p>
      <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
    </div>
  `

  // Agar BREVO_API_KEY set hai (Render pe) to Brevo, warna Gmail (local pe)
  if (process.env.BREVO_API_KEY) {
    await sendViaBrevo({ to: toEmail, subject, html })
  } else {
    await sendViaGmail({ to: toEmail, subject, html })
  }
}