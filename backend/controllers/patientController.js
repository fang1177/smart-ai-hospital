const Patient = require('../models/Patient');
const { success, error } = require('../utils/responseHelper');

// ─── GET /api/patients ── Admin & Doctor only ────────────────────────────────
const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find().populate('userId', 'name email avatar');
    return success(res, patients, 'Patients fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/patients/me ── Patient only ────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id }).populate(
      'userId',
      'name email avatar'
    );
    if (!patient) return error(res, 'Patient profile not found', 404);
    return success(res, patient, 'Profile fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/patients/:id ────────────────────────────────────────────────────
const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate('userId', 'name email avatar');
    if (!patient) return error(res, 'Patient not found', 404);
    return success(res, patient, 'Patient fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PUT /api/patients/:id ────────────────────────────────────────────────────
const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email');
    if (!patient) return error(res, 'Patient not found', 404);
    return success(res, patient, 'Patient updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── DELETE /api/patients/:id ── Admin only ───────────────────────────────────
const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return error(res, 'Patient not found', 404);
    return success(res, {}, 'Patient deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { getPatients, getMyProfile, getPatientById, updatePatient, deletePatient };
