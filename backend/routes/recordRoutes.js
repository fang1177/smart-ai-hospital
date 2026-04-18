const express = require('express');
const router = express.Router();
const { uploadRecord, getMyRecords, getRecords, deleteRecord } = require('../controllers/recordController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// IMPORTANT: /my before /:patientId
router.get('/my', protect, authorize('patient'), getMyRecords);
router.post('/upload', protect, authorize('doctor', 'admin'), upload.single('file'), uploadRecord);
router.get('/:patientId', protect, getRecords);
router.delete('/:id', protect, authorize('doctor', 'admin'), deleteRecord);

module.exports = router;
