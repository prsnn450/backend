const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
};

// @desc Get current logged in user
// @route GET /api/auth/me
// @access Private
exports.getMe = async (req, res, next) => {
try {
const user = await User.findById(req.user.id);

res.status(200).json({
  success: true,
  data: user,
});
} catch (err) {
next(err);
}
};

// @desc Forgot password
// @route POST /api/auth/forgotpassword
// @access Public
exports.forgotPassword = async (req, res, next) => {
const { email } = req.body;

try {
const user = await User.findOne({ email });
if (!user) {
  return next(new ErrorResponse('There is no user with that email', 404));
}

// Get reset token
const resetToken = user.getResetPasswordToken();

await user.save({ validateBeforeSave: false });

// Create reset URL
const resetUrl = `${req.protocol}://${req.get(
  'host'
)}/api/auth/resetpassword/${resetToken}`;

const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to:\n\n ${resetUrl}`;

try {
  await sendEmail({
    email: user.email,
    subject: 'Password reset token',
    message,
  });

  res.status(200).json({ success: true, data: 'Email sent' });
} catch (err) {
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save({ validateBeforeSave: false });

  return next(new ErrorResponse('Email could not be sent', 500));
}
} catch (err) {
next(err);
}
};

// @desc Reset password
// @route PUT /api/auth/resetpassword/:resettoken
// @access Public
exports.resetPassword = async (req, res, next) => {
// Get hashed token
const resetPasswordToken = crypto
.createHash('sha256')
.update(req.params.resettoken)
.digest('hex');

try {
const user = await User.findOne({
resetPasswordToken,
resetPasswordExpire: { $gt: Date.now() },
});

if (!user) {
  return next(new ErrorResponse('Invalid token', 400));
}

// Set new password
user.password = req.body.password;
user.resetPasswordToken = undefined;
user.resetPasswordExpire = undefined;
await user.save();

sendTokenResponse(user, 200, res);
} catch (err) {
next(err);
}
};

// @desc Update user details
// @route PUT /api/auth/updatedetails
// @access Private
exports.updateDetails = async (req, res, next) => {
const fieldsToUpdate = {
name: req.body.name,
email: req.body.email,
};

try {
const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
new: true,
runValidators: true,
});
res.status(200).json({
  success: true,
  data: user,
});
} catch (err) {
next(err);
}
};

// @desc Update password
// @route PUT /api/auth/updatepassword
// @access Private
exports.updatePassword = async (req, res, next) => {
const user = await User.findById(req.user.id).select('+password');

// Check current password
if (!(await user.matchPassword(req.body.currentPassword))) {
return next(new ErrorResponse('Password is incorrect', 401));
}

user.password = req.body.newPassword;
await user.save();

sendTokenResponse(user, 200, res);
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
// Create token
const token = process.env.JWT_SECRET;

const options = {
expires: new Date(
Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
),
httpOnly: true,
};

if (process.env.NODE_ENV === 'production') {
options.secure = true;
}

res
.status(statusCode)
.cookie('token', token, options)
.json({ success: true, token });
};
