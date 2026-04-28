const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/responseHelper');

exports.getLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('userId', 'name role email')
      .sort({ createdAt: -1 })
      .limit(100);
    return success(res, logs, 'Logs fetched successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
