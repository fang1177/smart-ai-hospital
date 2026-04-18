const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { success, error } = require('../utils/responseHelper');

// ─── POST /api/appointments ── Patient only ───────────────────────────────────
const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time) {
      return error(res, 'doctorId, date, and time are required', 422);
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return error(res, 'Patient profile not found. Complete registration first.', 404);

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name _id');
    if (!doctor) return error(res, 'Doctor not found', 404);

    // Check for existing booking at same slot
    const conflict = await Appointment.findOne({ doctorId, date, time, status: { $ne: 'cancelled' } });
    if (conflict) return error(res, 'This time slot is already booked. Choose a different time.', 409);

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      date,
      time,
      reason: reason || '',
    });

    // Notify patient
    await Notification.create({
      userId: req.user._id,
      message: `Appointment booked with Dr. ${doctor.userId.name} on ${date} at ${time}.`,
      type: 'appointment',
    });

    // Notify doctor
    await Notification.create({
      userId: doctor.userId._id,
      message: `New appointment request from ${req.user.name} on ${date} at ${time}.`,
      type: 'appointment',
    });

    // Notify all admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 0) {
      const adminNotifs = admins.map(admin => ({
        userId: admin._id,
        message: `New appointment created by ${req.user.name} with Dr. ${doctor.userId.name} on ${date} at ${time}.`,
        type: 'appointment',
      }));
      await Notification.insertMany(adminNotifs);
    }

    const populated = await appointment.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    ]);

    return success(res, populated, 'Appointment booked successfully', 201);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 'This time slot is already booked.', 409);
    }
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

module.exports = { bookAppointment, getAppointments, updateAppointmentStatus, cancelAppointment };
