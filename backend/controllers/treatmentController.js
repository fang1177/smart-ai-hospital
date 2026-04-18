const TreatmentCourse = require('../models/TreatmentCourse');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Notification = require('../models/Notification');
const { success, error } = require('../utils/responseHelper');

// ─── POST /api/treatments ── Doctor only ──────────────────────────────────────
const createCourse = async (req, res) => {
  try {
    const {
      patientId, appointmentId, title, diagnosis, instructions,
      medicines, dietAdvice, lifestyleNotes, followUpDate, startDate, endDate,
    } = req.body;

    if (!patientId || !title || !startDate || !endDate) {
      return error(res, 'patientId, title, startDate, and endDate are required', 422);
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return error(res, 'Doctor profile not found', 404);

    const patient = await Patient.findById(patientId).populate('userId', 'name _id');
    if (!patient) return error(res, 'Patient not found', 404);

    const course = await TreatmentCourse.create({
      patientId,
      doctorId: doctor._id,
      appointmentId: appointmentId || null,
      title,
      diagnosis: diagnosis || '',
      instructions: instructions || '',
      medicines: medicines || [],
      dietAdvice: dietAdvice || '',
      lifestyleNotes: lifestyleNotes || '',
      followUpDate: followUpDate || null,
      startDate,
      endDate,
    });

    // Notify the patient
    await Notification.create({
      userId: patient.userId._id,
      message: `Dr. ${req.user.name} has prescribed a treatment course: "${title}". Check your AI assistant for guidance.`,
      type: 'reminder',
    });

    const populated = await course.populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name email' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name email' } },
    ]);

    return success(res, populated, 'Treatment course created', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/treatments/my ── Patient only ──────────────────────────────────
const getMyCourses = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return error(res, 'Patient profile not found', 404);

    const courses = await TreatmentCourse.find({ patientId: patient._id })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    return success(res, courses, 'Treatment courses fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/treatments/my/active ── Patient only (active courses) ──────────
const getMyActiveCourses = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) return error(res, 'Patient profile not found', 404);

    const today = new Date().toISOString().split('T')[0];
    const courses = await TreatmentCourse.find({
      patientId: patient._id,
      status: 'active',
      startDate: { $lte: today },
      endDate:   { $gte: today },
    })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    return success(res, courses, 'Active treatment courses fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/treatments/patient/:patientId ── Doctor & Admin ────────────────
const getPatientCourses = async (req, res) => {
  try {
    const courses = await TreatmentCourse.find({ patientId: req.params.patientId })
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });

    return success(res, courses, 'Patient treatment courses fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── PATCH /api/treatments/:id/status ── Doctor & Admin ──────────────────────
const updateCourseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['active', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return error(res, `Invalid status. Must be one of: ${allowed.join(', ')}`, 422);
    }

    const course = await TreatmentCourse.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', populate: { path: 'userId', select: 'name _id' } },
      { path: 'doctorId', populate: { path: 'userId', select: 'name' } },
    ]);

    if (!course) return error(res, 'Treatment course not found', 404);

    // Notify patient
    if (course.patientId?.userId) {
      await Notification.create({
        userId: course.patientId.userId._id,
        message: `Your treatment course "${course.title}" has been marked as ${status}.`,
        type: 'reminder',
      });
    }

    return success(res, course, `Treatment course marked as ${status}`);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { createCourse, getMyCourses, getMyActiveCourses, getPatientCourses, updateCourseStatus };
