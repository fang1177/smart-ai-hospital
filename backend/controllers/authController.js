const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const { success, error } = require('../utils/responseHelper');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── POST /api/auth/register ─────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const {
      name, email, password, role,
      // Patient fields
      age, gender, bloodGroup,
      // Doctor fields
      specialization, experience, bio, consultationFee,
    } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email, and password are required', 422);
    }

    if (role === 'admin' || role === 'doctor') {
      return error(res, `Cannot register a ${role} account publicly`, 403);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return error(res, 'Email already registered', 409);

    const safeRole = role || 'patient';
    const isApproved = safeRole !== 'doctor'; // Doctors need approval

    const user = await User.create({ name, email, password, role: safeRole, isApproved });

    // Auto-create the corresponding profile
    if (user.role === 'patient') {
      await Patient.create({
        userId: user._id,
        age,
        gender,
        bloodGroup: bloodGroup || 'unknown',
      });
    } else if (user.role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        specialization: specialization || 'General Medicine',
        experience: experience || 0,
        bio: bio || '',
        consultationFee: consultationFee || 0,
      });
    }

    // Welcome notification
    await Notification.create({
      userId: user._id,
      message: `Welcome to SmartHospital, ${name}! Your ${user.role} account is ready.`,
      type: 'system',
    });

    const token = generateToken(user._id);
    
    await AuditLog.create({
      userId: user._id,
      action: 'User Registered',
      details: `Role: ${user.role}`,
      ipAddress: req.ip || ''
    });

    return success(
      res,
      { token, user: { id: user._id, name, email, role: user.role } },
      'Registration successful',
      201
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 422);
    }

    const user = await User.findOne({ email });
    if (!user) {
      await AuditLog.create({
        action: 'Failed Login',
        details: `Email: ${email} (User not found)`,
        ipAddress: req.ip || ''
      });
      return error(res, 'Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLog.create({
        userId: user._id,
        action: 'Failed Login',
        details: 'Incorrect password',
        ipAddress: req.ip || ''
      });
      return error(res, 'Invalid credentials', 401);
    }

    if (user.role === 'doctor' && !user.isApproved) {
      await AuditLog.create({
        userId: user._id,
        action: 'Login Attempt Blocked',
        details: 'Doctor pending approval',
        ipAddress: req.ip || ''
      });
      return error(res, 'Your doctor account is pending admin approval', 403);
    }

    const token = generateToken(user._id);

    await AuditLog.create({
      userId: user._id,
      action: 'User Login',
      details: `Role: ${user.role}`,
      ipAddress: req.ip || ''
    });
    return success(
      res,
      { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } },
      'Login successful'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    return success(res, { user: req.user }, 'Profile fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { register, login, getMe };
