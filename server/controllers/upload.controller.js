import cloudinary from '../config/cloudinary.js'
import Doctor from '../models/Doctor.model.js'

function uploadBufferToCloudinary(buffer, mimetype, folder) {
  const base64 = buffer.toString('base64')
  const dataUri = `data:${mimetype};base64,${base64}`
  return cloudinary.uploader.upload(dataUri, { folder })
}

export async function uploadDoctorPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' })
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      'jeevancare/doctor-photos'
    )

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { photo: result.secure_url },
      { new: true }
    )

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    res.json({ success: true, message: 'Photo uploaded', photoUrl: result.secure_url })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message || 'Upload failed' })
  }
}

export async function uploadClinicPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' })
    }

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      req.file.mimetype,
      'jeevancare/clinic-photos'
    )

    const doctor = await Doctor.findOneAndUpdate(
      { user: req.user.id },
      { clinicPhoto: result.secure_url },
      { new: true }
    )

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' })
    }

    res.json({ success: true, message: 'Clinic photo uploaded', photoUrl: result.secure_url })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: error.message || 'Upload failed' })
  }
}