const express = require('express');
const router = express.Router();
const {
  initiateBooking,
  verifyAndBook,
  getAppointments,
  updateAppointmentStatus,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/initiate', protect, authorize('patient'), initiateBooking);
router.post('/verify', protect, authorize('patient'), verifyAndBook);
router.get('/', protect, getAppointments);                                            // All roles (filtered by role)
router.patch('/:id/status', protect, authorize('doctor', 'admin'), updateAppointmentStatus);
router.patch('/:id/cancel', protect, cancelAppointment);

module.exports = router;
