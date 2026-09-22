import nodemailer from 'nodemailer'

// Transporter ab function ke ANDAR banate hain, top-level pe nahi.
// Isse yeh sirf tab banega jab actually email bhejni hogi — 
// tab tak dotenv.config() already chal chuka hoga aur env variables load ho chuke honge.
function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  })
}

export async function sendOTPEmail(toEmail, otp, purpose = 'verify') {
  const subject = purpose === 'reset' ? 'Reset your JeevanCare password' : 'Verify your JeevanCare account'
  const heading = purpose === 'reset' ? 'Password Reset Code' : 'Email Verification Code'

  const transporter = getTransporter()

  await transporter.sendMail({
    from: `"JeevanCare" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 20px;">
        <h2 style="color: #0d6efd;">${heading}</h2>
        <p>Your OTP code is:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111;">${otp}</p>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  })
}