const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getDoctors);                                  // All roles
router.get('/:id', protect, getDoctorById);                            // All roles
router.post('/', protect, authorize('admin'), createDoctor);           // Admin only
router.put('/:id', protect, authorize('admin', 'doctor'), updateDoctor); // Admin or Doctor
router.delete('/:id', protect, authorize('admin'), deleteDoctor);      // Admin only

module.exports = router;
