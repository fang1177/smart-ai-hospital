const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllRead,
  createNotification,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// IMPORTANT: read-all before /:id
router.patch('/read-all', protect, markAllRead);
router.get('/', protect, getNotifications);
router.patch('/:id/read', protect, markAsRead);
router.post('/', protect, authorize('admin'), createNotification);

module.exports = router;
