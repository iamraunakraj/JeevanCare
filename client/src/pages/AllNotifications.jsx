import { useEffect, useState, useCallback } from 'react'
import { CircularProgress, Pagination, Chip } from '@mui/material'
import { getAllMyNotifications, markAsRead } from '../services/notification.service.js'

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function AllNotifications() {
  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async (page) => {
    setLoading(true)
    try {
      const res = await getAllMyNotifications(page)
      setNotifications(res.notifications)
      setPagination(res.pagination)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications(1)
  }, [loadNotifications])

  async function handleClick(notification) {
    if (!notification.isRead) {
      await markAsRead(notification._id)
      loadNotifications(pagination.page)
    }
  }

  function handlePageChange(e, value) {
    loadNotifications(value)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">All Notifications</h1>

      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No notifications yet.</div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={`border border-gray-100 rounded-xl p-4 cursor-pointer transition-colors ${
                  !n.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.isRead && <Chip label="New" size="small" color="primary" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AllNotifications