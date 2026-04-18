const Notification = require('../models/Notification');
const { success, error } = require('../utils/responseHelper');

// ─── GET /api/notifications ───────────────────────────────────────────────────
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });

    return success(res, { notifications, unreadCount }, 'Notifications fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return error(res, 'Notification not found', 404);
    return success(res, notification, 'Marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return success(res, {}, 'All notifications marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── POST /api/notifications ── Admin only ────────────────────────────────────
const createNotification = async (req, res) => {
  try {
    const { userId, message, type } = req.body;
    if (!userId || !message) return error(res, 'userId and message are required', 422);

    const notification = await Notification.create({ userId, message, type: type || 'system' });
    return success(res, notification, 'Notification sent', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, createNotification };
