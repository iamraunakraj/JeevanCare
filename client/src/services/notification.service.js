import api from './api.js'

export async function getMyNotifications() {
  const res = await api.get('/notifications/my')
  return res.data
}

export async function markAsRead(id) {
  const res = await api.patch(`/notifications/${id}/read`)
  return res.data
}

export async function markAllAsRead() {
  const res = await api.patch('/notifications/read-all')
  return res.data
}