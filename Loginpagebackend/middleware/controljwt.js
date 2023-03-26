const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Set user in request object
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
return (req, res, next) => {
if (!roles.includes(req.user.role)) {
return next(
new ErrorResponse(
`User role ${req.user.role} is not authorized to access this route`,
403
)
);
}
next();
};
};

// Generate token and send response
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
