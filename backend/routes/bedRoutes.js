const express = require('express');
const router = express.Router();
const {
  getAllBeds,
  addBed,
  updateBedStatus,
  deleteBed,
  getBedStats
} = require('../controllers/bedController');
const { protect, adminOnly, adminOrDoctor } = require('../middleware/authMiddleware');

router.get('/', protect, getAllBeds);
router.post('/', protect, adminOnly, addBed);
router.put('/:id/status', protect, adminOrDoctor, updateBedStatus);
router.delete('/:id', protect, adminOnly, deleteBed);
router.get('/stats', protect, getBedStats);

module.exports = router;
