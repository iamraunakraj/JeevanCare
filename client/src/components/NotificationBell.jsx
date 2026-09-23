import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 15000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  function handleOpen(e) {
    setAnchorEl(e.currentTarget)
  }

  function handleClose() {
    setAnchorEl(null)
  }

  async function handleNotificationClick(notification) {
    await markAsRead(notification._id)
    loadNotifications() // read hote hi list se gayab ho jaayegi (kyunki ab sirf unread fetch hoti hai)
  }

  async function handleMarkAllRead() {
    await markAllAsRead()
    loadNotifications()
    handleClose()
  }

  function handleSeeAll() {
    handleClose()
    navigate('/notifications')
  }

  return (
    <>
      <IconButton onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose} slotProps={{ paper: { className: 'w-80 max-h-96' } }}>
        <div className="flex items-center justify-between px-3 py-2">
          <Typography variant="subtitle2" className="font-semibold">
            {unreadCount > 0 ? `New (${unreadCount})` : 'Notifications'}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Mark all read</Button>
          )}
        </div>
        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>No new notifications</MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n._id}
              onClick={() => handleNotificationClick(n)}
              className="bg-blue-50"
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

        <Divider />
        <MenuItem onClick={handleSeeAll} className="justify-center text-primary font-medium text-sm">
          See all notifications
        </MenuItem>
      </Menu>
    </>
  )
}

export default NotificationBell