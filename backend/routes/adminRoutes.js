const express = require('express');
const { approveDoctor, getPendingDoctors, createUser, getUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Only admin can access these routes
router.use(protect);
router.use(authorize('admin'));

router.get('/pending-doctors', getPendingDoctors);
router.patch('/doctors/:id/approve', approveDoctor);
router.post('/users', createUser);
router.get('/users', getUsers);

module.exports = router;
