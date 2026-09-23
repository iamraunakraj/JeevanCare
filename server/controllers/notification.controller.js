import Notification from '../models/Notification.model.js'

// Bell dropdown ke liye — sirf UNREAD notifications (max 10)
export async function getMyNotifications(req, res) {
  try {
    const notifications = await Notification.find({ user: req.user.id, isRead: false })
      .sort({ createdAt: -1 })
      .limit(10)

    const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false })

    res.json({ success: true, notifications, unreadCount })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: 'Something went wrong' })
  }
}

// "See all" page ke liye — SAARI notifications (read + unread), paginated
export async function getAllMyNotifications(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = 20
    const skip = (page - 1) * limit

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalCount = await Notification.countDocuments({ user: req.user.id })

    res.json({
      success: true,
      notifications,
      pagination: { page, totalPages: Math.ceil(totalCount / limit), totalCount },
    })
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