const Doctor = require('../models/Doctor');
const { success, error } = require('../utils/responseHelper');

// ─── GET /api/doctors ─────────────────────────────────────────────────────────
const getDoctors = async (req, res) => {
  try {
    const { specialization } = req.query;
    const filter = specialization ? { specialization: new RegExp(specialization, 'i') } : {};
    const doctors = await Doctor.find(filter).populate('userId', 'name email avatar');
    return success(res, doctors, 'Doctors fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/doctors/:id ─────────────────────────────────────────────────────
const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email avatar');
    if (!doctor) return error(res, 'Doctor not found', 404);
    return success(res, doctor, 'Doctor fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── POST /api/doctors ── Admin only ─────────────────────────────────────────
const createDoctor = async (req, res) => {
  try {
    const { userId, specialization, experience, bio, availability, consultationFee } = req.body;

    const existing = await Doctor.findOne({ userId });
    if (existing) return error(res, 'Doctor profile already exists for this user', 409);

    const doctor = await Doctor.create({
      userId, specialization, experience, bio, availability, consultationFee,
    });
    return success(res, doctor, 'Doctor created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PUT /api/doctors/:id ─────────────────────────────────────────────────────
const updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email');
    if (!doctor) return error(res, 'Doctor not found', 404);
    return success(res, doctor, 'Doctor updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── DELETE /api/doctors/:id ── Admin only ───────────────────────────────────
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return error(res, 'Doctor not found', 404);
    return success(res, {}, 'Doctor deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor };
