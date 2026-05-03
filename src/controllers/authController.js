const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ ...user }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

// @desc    Register a new user (admin only in prod, open for first setup)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    const user = await User.create({
      username,
      password_hash: password,
      full_name,
      email,
      role: role || 'admin',
      last_login: new Date()
    });
    let tokenData = {
      id: user._id,
      role: user?.role,
      is_active: user.is_active,
      last_login: user?.last_login
    }
    const token = generateToken(tokenData);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    const user = await User.findOne({ username }).select('+password_hash');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Update last login
    user.last_login = new Date();
    await user.save({ validateBeforeSave: false });
    let tokenData = {
      id: user._id,
      role: user?.role,
      is_active: user.is_active,
      last_login: user?.last_login
    }
    const token = generateToken(tokenData);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { full_name, email },
      { new: true, runValidators: true }
    );
    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password_hash');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password_hash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
