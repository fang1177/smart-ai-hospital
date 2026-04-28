const express = require('express');
const router = express.Router();
const {
  createEmergency,
  getActiveEmergencies,
  getAllEmergencies,
  updateEmergencyStatus
} = require('../controllers/emergencyController');
const { protect, adminOnly, adminOrDoctor } = require('../middleware/authMiddleware');

router.post('/', protect, createEmergency);
router.get('/active', protect, adminOrDoctor, getActiveEmergencies);
router.get('/', protect, adminOnly, getAllEmergencies);
router.put('/:id/status', protect, adminOrDoctor, updateEmergencyStatus);

module.exports = router;
