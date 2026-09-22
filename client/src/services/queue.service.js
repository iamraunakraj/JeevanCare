import api from './api.js'

export async function getToken(doctorId, date, patientDetails, reason, paymentMethod) {
  const res = await api.post('/queues/token', { doctorId, date, patientDetails, reason, paymentMethod })
  return res.data
}

export async function getMyTokenStatus(doctorId, date) {
  const res = await api.get('/queues/my-status', { params: { doctorId, date } })
  return res.data
}

export async function cancelToken(id) {
  const res = await api.patch(`/queues/${id}/cancel`)
  return res.data
}

export async function getDoctorQueue(date) {
  const res = await api.get('/queues/doctor/list', { params: { date } })
  return res.data
}

export async function callNextPatient(date) {
  const res = await api.post('/queues/doctor/call-next', { date })
  return res.data
}

export async function startConsultation(id) {
  const res = await api.patch(`/queues/${id}/start`)
  return res.data
}

export async function completeConsultation(id) {
  const res = await api.patch(`/queues/${id}/complete`)
  return res.data
}

export async function markNoShow(id) {
  const res = await api.patch(`/queues/${id}/no-show`)
  return res.data
}