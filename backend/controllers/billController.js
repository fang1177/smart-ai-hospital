const Razorpay = require('razorpay');
const crypto = require('crypto');
const Bill = require('../models/Bill');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/responseHelper');

/**
 * ─── POST /api/bills ── Doctor/Admin Only ──────────────────────────────────────
 */
const createBill = async (req, res) => {
  try {
    const { patientId, appointmentId, title, items, dueDate } = req.body;

    if (!patientId || !title || !items || !dueDate) {
      return error(res, 'Required fields missing', 422);
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor && req.user.role !== 'admin') {
      return error(res, 'Only doctors or admins can create bills', 403);
    }

    const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    const bill = await Bill.create({
      patientId,
      doctorId: doctor ? doctor._id : null,
      createdBy: req.user._id,
      appointmentId: appointmentId || null,
      title,
      items,
      totalAmount,
      dueDate,
    });

    // Notify patient — look up patient's User ID
    const patient = await Patient.findById(patientId).populate('userId', '_id name');
    if (patient?.userId) {
      await Notification.create({
        userId: patient.userId._id,
        message: `💳 New bill "${title}" of ₹${totalAmount} has been raised. Due: ${new Date(dueDate).toLocaleDateString('en-IN')}.`,
        type: 'bill',
      });
    }

    return success(res, bill, 'Bill created successfully', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * ─── GET /api/bills/my ── Patient Only ─────────────────────────────────────────
 */
const getMyBills = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return error(res, 'Patient profile not found', 404);

    const bills = await Bill.find({ patientId: patient._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 });

    return success(res, bills, 'Bills fetched successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * ─── GET /api/bills ── Admin/Doctor Only ──────────────────────────────────────
 */
const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    return success(res, bills, 'All bills fetched successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * ─── POST /api/bills/:id/pay ── Patient Only ──────────────────────────────────
 * Creates a Razorpay Order
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return error(res, 'Bill not found', 404);
    if (bill.status === 'paid') return error(res, 'Bill already paid', 400);

    const isPlaceholder = !process.env.RAZORPAY_KEY_ID || 
                          process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id' ||
                          !process.env.RAZORPAY_KEY_SECRET ||
                          process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret';

    if (isPlaceholder) {
      // Demo mode — mark bill as paid immediately
      bill.status = 'paid';
      bill.paidAt = Date.now();
      bill.razorpayOrderId = 'demo_order_' + Date.now();
      bill.razorpayPaymentId = 'demo_pay_' + Date.now();
      await bill.save();
      return success(res, { isDemo: true, bill }, 'Bill paid in demo mode');
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: bill.totalAmount * 100,
      currency: 'INR',
      receipt: `bill_${bill._id}`,
    });
    
    bill.razorpayOrderId = order.id;
    await bill.save();

    return success(res, { 
      orderId: order.id, 
      amount: bill.totalAmount, 
      keyId: process.env.RAZORPAY_KEY_ID 
    }, 'Razorpay order created');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

/**
 * ─── POST /api/bills/verify ────────────────────────────────────────────────────
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      const bill = await Bill.findOne({ razorpayOrderId: razorpay_order_id });
      if (!bill) return error(res, 'Bill not found for this order', 404);

      bill.status = 'paid';
      bill.razorpayPaymentId = razorpay_payment_id;
      bill.paidAt = Date.now();
      await bill.save();

      if (req.user) {
        await AuditLog.create({
          userId: req.user._id,
          action: 'Payment Verified',
          details: `Bill ID: ${bill._id}, Amount: ${bill.totalAmount}`,
          ipAddress: req.ip || ''
        });
      }

      return success(res, bill, 'Payment verified and bill updated');
    } else {
      if (req.user) {
        await AuditLog.create({
          userId: req.user._id,
          action: 'Payment Failed',
          details: `Invalid signature for Order: ${razorpay_order_id}`,
          ipAddress: req.ip || ''
        });
      }
      return error(res, 'Invalid payment signature', 400);
    }
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { createBill, getMyBills, getAllBills, createRazorpayOrder, verifyPayment };
