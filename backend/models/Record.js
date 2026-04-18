const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
    },
    type: {
      type: String,
      enum: ['xray', 'prescription', 'ecg', 'report', 'lab'],
      required: [true, 'Record type is required'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Record', recordSchema);
