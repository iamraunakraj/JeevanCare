import api from './api.js'

export async function getMyDoctorProfile() {
  const res = await api.get('/doctors/me/profile')
  return res.data
}

export async function updateMyDoctorProfile(data) {
  const res = await api.patch('/doctors/me/profile', data)
  return res.data
}

export async function getDoctors() {
  const res = await api.get('/doctors')
  return res.data
}

export async function getDoctorById(id) {
  const res = await api.get(`/doctors/${id}`)
  return res.data
}