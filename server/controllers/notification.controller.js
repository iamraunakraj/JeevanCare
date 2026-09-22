import Notification from '../models/Notification.model.js'

export async function getMyNotifications(req, res) {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(30)

    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false })

    res.json({ success: true, notifications, unreadCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function markAsRead(req, res) {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id })
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' })
    }
    notification.isRead = true
    await notification.save()
    res.json({ success: true, notification })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

export async function markAllAsRead(req, res) {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true })
    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}