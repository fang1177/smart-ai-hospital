const express = require('express');
const router = express.Router();
const {
  createCourse,
  getMyCourses,
  getMyActiveCourses,
  getPatientCourses,
  updateCourseStatus,
} = require('../controllers/treatmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Patient endpoints
router.get('/my',        protect, authorize('patient'), getMyCourses);
router.get('/my/active', protect, authorize('patient'), getMyActiveCourses);

// Doctor endpoints
router.post('/',                    protect, authorize('doctor'), createCourse);
router.get('/patient/:patientId',   protect, authorize('doctor', 'admin'), getPatientCourses);
router.patch('/:id/status',         protect, authorize('doctor', 'admin'), updateCourseStatus);

module.exports = router;
