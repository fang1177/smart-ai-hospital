const Bed = require('../models/Bed');
const AuditLog = require('../models/AuditLog');
const { success, error } = require('../utils/responseHelper');

exports.getAllBeds = async (req, res) => {
  try {
    const beds = await Bed.find().populate('patientId', 'name');
    return success(res, beds, 'Beds fetched successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.addBed = async (req, res) => {
  try {
    const { bedNumber, wardType } = req.body;
    const bed = await Bed.create({ bedNumber, wardType });

    await AuditLog.create({
      userId: req.user._id,
      action: 'Bed Added',
      details: `Bed ${bedNumber} in ${wardType}`,
      ipAddress: req.ip || ''
    });

    return success(res, bed, 'Bed added successfully', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.updateBedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, patientId } = req.body;

    const bed = await Bed.findById(id);
    if (!bed) return error(res, 'Bed not found', 404);

    bed.status = status;
    if (patientId !== undefined) {
      bed.patientId = patientId || null;
    }

    await bed.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'Bed Status Updated',
      details: `Bed ${bed.bedNumber} set to ${status}`,
      ipAddress: req.ip || ''
    });

    return success(res, bed, 'Bed status updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.deleteBed = async (req, res) => {
  try {
    const { id } = req.params;
    const bed = await Bed.findByIdAndDelete(id);
    if (!bed) return error(res, 'Bed not found', 404);

    await AuditLog.create({
      userId: req.user._id,
      action: 'Bed Deleted',
      details: `Bed ${bed.bedNumber}`,
      ipAddress: req.ip || ''
    });

    return success(res, {}, 'Bed deleted successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

exports.getBedStats = async (req, res) => {
  try {
    const stats = await Bed.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const formattedStats = { available: 0, occupied: 0, maintenance: 0, total: 0 };
    stats.forEach(s => {
      if (formattedStats[s._id] !== undefined) {
        formattedStats[s._id] = s.count;
      }
      formattedStats.total += s.count;
    });
    return success(res, formattedStats, 'Bed stats fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};
