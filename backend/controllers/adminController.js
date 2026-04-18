const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { success, error } = require('../utils/responseHelper');

// ─── PATCH /api/admin/doctors/:id/approve ─────────────────────────────────────
const approveDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) return error(res, 'User not found', 404);
    if (user.role !== 'doctor') return error(res, 'Target user is not a doctor', 400);

    if (user.isApproved) {
      return error(res, 'Doctor is already approved', 400);
    }

    user.isApproved = true;
    await user.save();

    return success(res, { user: { id: user._id, name: user.name, isApproved: user.isApproved } }, 'Doctor has been approved');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getPendingDoctors = async (req, res) => {
  try {
    const pendingDoctors = await User.find({ role: 'doctor', isApproved: false }).select('-password');
    return success(res, { doctors: pendingDoctors }, 'Pending doctors retrieved successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ─── POST /api/admin/users ────────────────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, ...profileData } = req.body;

    if (!name || !email || !password || !role) {
      return error(res, 'Name, email, password, and role are required', 422);
    }

    const validRoles = ['admin', 'doctor', 'patient'];
    if (!validRoles.includes(role)) {
      return error(res, 'Invalid role', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return error(res, 'Email already registered', 409);

    // Admin-created users are automatically approved
    const user = await User.create({ name, email, password, role, isApproved: true });

    // Auto-create the corresponding profile based on role
    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        specialization: profileData.specialization || 'General Medicine',
        experience: profileData.experience || 0,
        bio: profileData.bio || '',
        consultationFee: profileData.consultationFee || 0,
      });
    } else if (role === 'patient') {
      await Patient.create({
        userId: user._id,
        age: profileData.age,
        gender: profileData.gender,
        bloodGroup: profileData.bloodGroup || 'unknown',
      });
    }

    return success(
      res,
      { user: { id: user._id, name, email, role: user.role } },
      `${role} account created successfully`,
      201
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter).select('-password').sort('-createdAt');
    return success(res, { users }, 'Users retrieved successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { approveDoctor, getPendingDoctors, createUser, getUsers };
