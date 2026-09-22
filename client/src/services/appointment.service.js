import api from './api.js'

export async function getAvailableSlots(doctorId, date) {
  const res = await api.get(`/appointments/slots/${doctorId}`, { params: { date } })
  return res.data
}

export async function bookAppointment(data) {
  const res = await api.post('/appointments', data)
  return res.data
}

export async function getMyAppointments() {
  const res = await api.get('/appointments/my')
  return res.data
}

export async function cancelAppointment(id) {
  const res = await api.patch(`/appointments/${id}/cancel`)
  return res.data
}

export async function getDoctorAppointments(params) {
  const res = await api.get('/appointments/doctor/list', { params })
  return res.data
}

export async function updateAppointmentStatus(id, status) {
  const res = await api.patch(`/appointments/${id}/status`, { status })
  return res.data
}