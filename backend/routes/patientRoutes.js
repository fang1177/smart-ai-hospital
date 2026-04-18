const express = require('express');
const router = express.Router();
const {
  getPatients,
  getMyProfile,
  getPatientById,
  updatePatient,
  deletePatient,
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/authMiddleware');

// IMPORTANT: /me must be defined BEFORE /:id, otherwise 'me' is treated as an ObjectId
router.get('/me', protect, authorize('patient'), getMyProfile);
router.get('/', protect, authorize('admin', 'doctor'), getPatients);
router.get('/:id', protect, authorize('admin', 'doctor'), getPatientById);
router.put('/:id', protect, authorize('admin', 'patient'), updatePatient);
router.delete('/:id', protect, authorize('admin'), deletePatient);

module.exports = router;
