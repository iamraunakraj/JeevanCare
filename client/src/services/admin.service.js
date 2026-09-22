import api from './api.js'

export async function getStats() {
  const res = await api.get('/admin/stats')
  return res.data
}

export async function getAllDoctorsAdmin(status) {
  const res = await api.get('/admin/doctors', { params: { status } })
  return res.data
}

export async function verifyDoctor(id) {
  const res = await api.patch(`/admin/doctors/${id}/verify`)
  return res.data
}

export async function suspendDoctor(id) {
  const res = await api.patch(`/admin/doctors/${id}/suspend`)
  return res.data
}

export async function activateDoctor(id) {
  const res = await api.patch(`/admin/doctors/${id}/activate`)
  return res.data
}

export async function getAllPatients() {
  const res = await api.get('/admin/patients')
  return res.data
}

export async function blockUser(id) {
  const res = await api.patch(`/admin/patients/${id}/block`)
  return res.data
}

export async function unblockUser(id) {
  const res = await api.patch(`/admin/patients/${id}/unblock`)
  return res.data
}

export async function getAllAppointmentsAdmin(params) {
  const res = await api.get('/admin/appointments', { params })
  return res.data
}