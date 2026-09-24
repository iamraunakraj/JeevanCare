import api from './api.js'

export async function getMyDoctorProfile() {
  const res = await api.get('/doctors/me/profile')
  return res.data
}

export async function updateMyDoctorProfile(data) {
  const res = await api.patch('/doctors/me/profile', data)
  return res.data
}

export async function searchDoctors(params) {
  const res = await api.get('/doctors', { params })
  return res.data
}

export async function getDoctorById(id) {
  const res = await api.get(`/doctors/${id}`)
  return res.data
}

export async function getFilterOptions() {
  const res = await api.get('/doctors/filter-options')
  return res.data
}
export async function getSearchSuggestions(query) {
  const res = await api.get('/doctors/suggestions', { params: { q: query } })
  return res.data
}