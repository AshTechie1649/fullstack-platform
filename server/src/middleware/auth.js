const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// 1. Authentication Guard: Verifies Access Token and hydrates req.user
const protect = catchAsync(async (req, res, next) => {
  // A. Check for Authorization header with Bearer scheme
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('Authentication required. Please provide a Bearer token.', 401)
    );
  }

  // B. Cryptographic signature and expiration verification
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Access token has expired. Please refresh your session.', 401));
    }
    return next(new AppError('Invalid access token. Authentication failed.', 401));
  }

  // C. Verify user still exists in the database
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // D. Verify user did not change password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401)
    );
  }

  // E. Hydrate request with authenticated user document
  req.user = currentUser;
  next();
});

// 2. Authorization Guard: Role-Based Access Control (RBAC)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // protect middleware must run prior to restrictTo
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo,
};
