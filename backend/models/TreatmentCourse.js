const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    dosage:    { type: String, default: '' },           // e.g. "500mg"
    frequency: { type: String, default: '' },           // e.g. "Twice daily"
    timing:    { type: String, default: '' },           // e.g. "After meals"
    notes:     { type: String, default: '' },
  },
  { _id: false }
);

const treatmentCourseSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: 200,
    },
    diagnosis: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    instructions: {
      type: String,
      default: '',
      maxlength: 2000,
    },
    medicines: {
      type: [medicineSchema],
      default: [],
    },
    dietAdvice: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    lifestyleNotes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    followUpDate: {
      type: String,   // ISO date string
      default: null,
    },
    startDate: {
      type: String,   // ISO date string
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: String,   // ISO date string
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Index for fast patient lookups
treatmentCourseSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('TreatmentCourse', treatmentCourseSchema);
