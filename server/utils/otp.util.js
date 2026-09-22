import crypto from 'crypto'

// 6-digit random numeric OTP banata hai, jaise "482913"
export function generateOTP() {
  return crypto.randomInt(100000, 999999).toString()
}

// OTP expiry time — abhi se 10 minutes baad
export function getOTPExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000)
}