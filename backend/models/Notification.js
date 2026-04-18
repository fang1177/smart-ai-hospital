const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['appointment', 'reminder', 'system', 'record', 'medicine', 'bill'],
      default: 'system',
    },
    isHighIntensity: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Map,
      of: String,
      default: {}
    },
    read: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fast per-user lookups, newest first
notificationSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
