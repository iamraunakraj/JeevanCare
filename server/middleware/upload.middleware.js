import multer from 'multer'

// Memory storage — file temporarily RAM mein rehti hai (disk pe save nahi hoti),
// kyunki hum use turant Cloudinary pe bhej denge, apne server pe store nahi karna
const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
})