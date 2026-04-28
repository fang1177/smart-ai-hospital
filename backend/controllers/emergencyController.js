const Emergency = require('../models/Emergency');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { success, error } = require('../utils/responseHelper');

exports.createEmergency = async (req, res) => {
  try {
    const { emergencyType, issueDescription, locationText, ambulanceRequested } = req.body;
    
    const emergency = await Emergency.create({
      patientId: req.user._id,
      emergencyType,
      issueDescription,
      locationText,
      ambulanceRequested
    });

    await AuditLog.create({
      userId: req.user._id,
      action: 'Emergency Created',
      details: `Type: ${emergencyType}, Location: ${locationText}`,
      ipAddress: req.ip || ''
    });

    // Notify ALL admins and doctors with high-priority SOS alert
    const staff = await User.find({ role: { $in: ['admin', 'doctor'] } });
    const patientName = req.user.name || 'Unknown Patient';
    const notifications = staff.map(s => ({
      userId: s._id,
      message: `🚨 EMERGENCY SOS from ${patientName}: ${emergencyType} — ${issueDescription || 'No description'} (${locationText || 'No location'})`,
      type: 'system'
    }));
    await Notification.insertMany(notifications);

    return success(res, emergency, 'Emergency request submitted successfully', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getActiveEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find({ status: { $in: ['pending', 'accepted'] } })
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });
    return success(res, emergencies, 'Active emergencies fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getAllEmergencies = async (req, res) => {
  try {
    const emergencies = await Emergency.find()
      .populate('patientId', 'name email phone')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 });
    return success(res, emergencies, 'All emergencies fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateEmergencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'accepted', 'resolved'].includes(status)) {
      return error(res, 'Invalid status', 400);
    }

    const emergency = await Emergency.findById(id);
    if (!emergency) return error(res, 'Emergency not found', 404);

    emergency.status = status;
    if (status === 'resolved') {
      emergency.resolvedBy = req.user._id;
    }

    await emergency.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'Emergency Updated',
      details: `Emergency ID: ${id} set to ${status}`,
      ipAddress: req.ip || ''
    });

    return success(res, emergency, 'Emergency status updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
