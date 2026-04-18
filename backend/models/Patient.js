const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' },
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
      default: 'unknown',
    },
    medicalHistory: {
      type: [String], // e.g. ['Diabetes', 'Hypertension']
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
