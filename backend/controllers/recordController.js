const Record = require('../models/Record');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { success, error } = require('../utils/responseHelper');

// ─── POST /api/records/upload ── Doctor & Admin only ─────────────────────────
const uploadRecord = async (req, res) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);

    const { patientId, type, notes } = req.body;
    if (!patientId || !type) return error(res, 'patientId and type are required', 422);

    let doctorId = null;
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) doctorId = doctor._id;
    }

    // Phase 1: store locally. Phase 2: pipe to Firebase Storage
    const fileUrl = `/uploads/${req.file.filename}`;

    const record = await Record.create({
      patientId,
      doctorId,
      type,
      fileUrl,
      fileName: req.file.originalname,
      notes: notes || '',
    });

    return success(res, record, 'Medical record uploaded', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/records/my ── Patient only ─────────────────────────────────────
const getMyRecords = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return error(res, 'Patient profile not found', 404);

    const records = await Record.find({ patientId: patient._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ uploadedAt: -1 });

    return success(res, records, 'Records fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/records/:patientId ─────────────────────────────────────────────
const getRecords = async (req, res) => {
  try {
    const { type } = req.query;
    const filter = { patientId: req.params.patientId };
    if (type) filter.type = type;

    const records = await Record.find(filter)
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ uploadedAt: -1 });

    return success(res, records, 'Records fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── DELETE /api/records/:id ─────────────────────────────────────────────────
const deleteRecord = async (req, res) => {
  try {
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) return error(res, 'Record not found', 404);
    return success(res, {}, 'Record deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { uploadRecord, getMyRecords, getRecords, deleteRecord };
