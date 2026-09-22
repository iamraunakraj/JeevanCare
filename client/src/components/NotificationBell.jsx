import { useEffect, useState, useCallback } from 'react'
import { IconButton, Badge, Menu, MenuItem, Typography, Button, Divider } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { getMyNotifications, markAsRead, markAllAsRead } from '../services/notification.service.js'

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const loadNotifications = useCallback(async () => {
    try {
      const res = await getMyNotifications()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch (err) {
      // ignore
    }
  }, [])

  // Har 15 second mein naye notifications check karo (light-weight polling —
  // Socket.IO idhar bhi use kar sakte the, lekin notification count itna time-critical nahi hai)
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  async function handleOpen(e) {
    setAnchorEl(e.currentTarget)
  }

  function handleClose() {
    setAnchorEl(null)
  }

  async function handleNotificationClick(notification) {
    if (!notification.isRead) {
      await markAsRead(notification._id)
      loadNotifications()
    }
  }

  async function handleMarkAllRead() {
    await markAllAsRead()
    loadNotifications()
  }

  return (
    <>
      <IconButton onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
  anchorEl={anchorEl}
  open={!!anchorEl}
  onClose={handleClose}
  slotProps={{ paper: { className: 'w-80 max-h-96' } }}
>
        <div className="flex items-center justify-between px-3 py-2">
          <Typography variant="subtitle2" className="font-semibold">Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </div>
        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>No notifications yet</MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className={!n.isRead ? 'bg-blue-50' : ''}
              sx={{ whiteSpace: 'normal', alignItems: 'flex-start' }}
            >
              <div className="py-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</p>
              </div>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  )
}

export default NotificationBell