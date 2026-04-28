const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { success, error } = require('../utils/responseHelper');

// Lazy Razorpay instantiation — avoids crash when keys are placeholder/missing at startup
const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── POST /api/appointments ── Patient only ───────────────────────────────────
// ─── POST /api/appointments/initiate ── Create Order ─────────────────────────
const initiateBooking = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time) {
      return error(res, 'doctorId, date, and time are required', 422);
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return error(res, 'Patient profile not found.', 404);

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return error(res, 'Doctor not found', 404);

    // Check for existing booking
    const conflict = await Appointment.findOne({ doctorId, date, time, status: { $ne: 'cancelled' } });
    if (conflict) return error(res, 'This time slot is already taken.', 409);

    const fee = doctor.consultationFee || 500;
    let orderId = 'demo_order_' + Date.now();
    let isDemo = false;

    // Check if keys are placeholders
    const isPlaceholder = !process.env.RAZORPAY_KEY_ID || 
                          process.env.RAZORPAY_KEY_ID === 'your_razorpay_key_id' ||
                          !process.env.RAZORPAY_KEY_SECRET ||
                          process.env.RAZORPAY_KEY_SECRET === 'your_razorpay_key_secret';

    if (!isPlaceholder) {
      try {
        const options = {
          amount: fee * 100,
          currency: 'INR',
          receipt: `apt_${Date.now()}`,
        };
        const order = await getRazorpay().orders.create(options);
        orderId = order.id;
      } catch (rzpErr) {
        console.error('Razorpay Error:', rzpErr);
        return error(res, `Razorpay configuration error: ${rzpErr.description || rzpErr.message || 'Invalid API Keys'}`, 500);
      }
    } else {
      isDemo = true;
      console.log('--- RAZORPAY DEMO MODE ACTIVE (Placeholder keys detected) ---');
    }

    // Create a temporary appointment record in "awaiting_payment"
    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      date,
      time,
      reason: reason || '',
      status: isDemo ? 'pending' : 'awaiting_payment', // Skip payment if demo
      paymentStatus: isDemo ? 'paid' : 'pending',
      razorpayOrderId: orderId,
      amountPaid: fee
    });

    return success(res, {
      orderId: orderId,
      amount: fee,
      appointmentId: appointment._id,
      keyId: isPlaceholder ? 'rzp_test_demo' : process.env.RAZORPAY_KEY_ID,
      isDemo
    }, isDemo ? 'Booking successful (Demo Mode)' : 'Payment initiated');
  } catch (err) {
    console.error('INITIATE_BOOKING_ERROR:', err);
    return error(res, `Booking Initiation Failed: ${err ? (err.message || JSON.stringify(err)) : 'Unknown Error'}`, 500);
  }
};

// ─── POST /api/appointments/verify ── Verify & Confirm ──────────────────────
const verifyAndBook = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return error(res, 'Invalid payment signature', 400);
    }

    const appointment = await Appointment.findById(appointmentId).populate('doctorId').populate('patientId');
    if (!appointment) return error(res, 'Appointment record not found', 404);

    appointment.status = 'pending'; // Now it goes to the doctor for confirmation
    appointment.paymentStatus = 'paid';
    appointment.razorpayPaymentId = razorpay_payment_id;
    await appointment.save();

    // Notifications
    const doc = await Doctor.findById(appointment.doctorId).populate('userId');
    await Notification.create({
      userId: req.user._id,
      message: `Payment successful! Your appointment with Dr. ${doc.userId.name} is now pending doctor confirmation.`,
      type: 'appointment'
    });

    await Notification.create({
      userId: doc.userId._id,
      message: `New paid appointment from ${req.user.name} on ${appointment.date}. Please confirm.`,
      type: 'appointment'
    });

    return success(res, appointment, 'Appointment booked and payment verified');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/appointments ────────────────────────────────────────────────────
const getAppointments = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user._id });
      if (patient) filter.patientId = patient._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) filter.doctorId = doctor._id;
    }
    // admin sees all

    const appointments = await Appointment.find(filter)
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name email' } })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    return success(res, appointments, 'Appointments fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PATCH /api/appointments/:id/status ── Doctor & Admin ────────────────────
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return error(res, `Invalid status. Must be one of: ${allowed.join(', ')}`, 422);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    ).populate({ path: 'patientId', populate: { path: 'userId', select: 'name _id' } });

    if (!appointment) return error(res, 'Appointment not found', 404);

    // Notify patient of status change
    if (appointment.patientId?.userId) {
      await Notification.create({
        userId: appointment.patientId.userId._id,
        message: `Your appointment on ${appointment.date} at ${appointment.time} has been ${status}.`,
        type: 'appointment',
      });
    }

    return success(res, appointment, `Appointment marked as ${status}`);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PATCH /api/appointments/:id/cancel ──────────────────────────────────────
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) return error(res, 'Appointment not found', 404);
    return success(res, appointment, 'Appointment cancelled');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { initiateBooking, verifyAndBook, getAppointments, updateAppointmentStatus, cancelAppointment };
