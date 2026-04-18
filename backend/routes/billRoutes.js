const express = require('express');
const router = express.Router();
const { 
  createBill, 
  getMyBills, 
  createRazorpayOrder, 
  verifyPayment 
} = require('../controllers/billController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/bills/my — Patient only
router.get('/my', protect, authorize('patient'), getMyBills);

// POST /api/bills — Doctor or Admin
router.post('/', protect, authorize('doctor', 'admin'), createBill);

// POST /api/bills/:id/pay — Patient initiates Razorpay
router.post('/:id/pay', protect, authorize('patient'), createRazorpayOrder);

// POST /api/bills/verify — Verify payment
router.post('/verify', protect, authorize('patient'), verifyPayment);

module.exports = router;
