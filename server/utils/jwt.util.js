import jwt from 'jsonwebtoken'

// User login/signup ke baad ek token generate karta hai
// Isme sirf id aur role daalte hain — password ya sensitive data kabhi nahi
export function generateToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 din baad token expire ho jaayega
  )
}

// Token ko verify karta hai (middleware isse use karega)
export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}