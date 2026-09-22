import { verifyToken } from '../utils/jwt.util.js'

// Yeh middleware check karta hai ki request ke saath valid JWT token hai ya nahi.
// Agar hai, to decoded user info (id, role) req.user mein daal deta hai,
// taaki aage controllers usse use kar sakein.
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization // format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = verifyToken(token)
    req.user = decoded // { id, role }
    next() // sab thik hai, agle middleware/controller pe jaao
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

// Yeh ek "factory" function hai — allowed roles ki list leta hai,
// aur ek middleware return karta hai jo check karega user ka role
// us list mein hai ya nahi.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied for this role' })
    }
    next()
  }
}