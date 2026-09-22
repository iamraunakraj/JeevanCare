import api from './api.js'

export async function uploadDoctorPhoto(file) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await api.post('/upload/doctor-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function uploadClinicPhoto(file) {
  const formData = new FormData()
  formData.append('image', file)
  const res = await api.post('/upload/clinic-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}