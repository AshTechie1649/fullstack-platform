const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const {
  signAccessToken,
  signRefreshToken,
  setRefreshTokenCookie,
} = require('../utils/token');

// POST /api/auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // 1. Verify email uniqueness
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('An account with this email already exists', 409));
  }

  // 2. Persist new user (Pre-save hook will hash the password)
  const user = await User.create({
    name,
    email,
    password,
  });

  // 3. Issue dual tokens
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // 4. Save refresh token to user record in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 5. Send refresh token in HttpOnly cookie & access token in JSON body
  setRefreshTokenCookie(res, refreshToken);

  res.status(201).json({
    status: 'success',
    accessToken,
    data: {
      user,
    },
  });
});

// POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Query user and explicitly select password field (+password)
  const user = await User.findOne({ email }).select('+password');

  // 2. Generic error message prevents account enumeration
  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // 3. Issue new dual tokens
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  // 4. Update stored refresh token in DB
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // 5. Dispatch cookie & response
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    status: 'success',
    accessToken,
    data: {
      user,
    },
  });
});

// POST /api/auth/refresh
exports.refreshToken = catchAsync(async (req, res, next) => {
  // 1. Read refresh token from HttpOnly cookie
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    return next(new AppError('No refresh token provided. Please log in.', 401));
  }

  // 2. Cryptographic verification of the token
  let decoded;
  try {
    const jwt = require('jsonwebtoken');
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token. Please log in again.', 403));
  }

  // 3. Find user and include stored refreshToken
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user) {
    return next(new AppError('The account belonging to this token no longer exists.', 401));
  }

  // 4. Token Reuse Detection: Ensure cookie token matches stored DB token
  if (user.refreshToken !== incomingRefreshToken) {
    // Potential breach: revoke all sessions immediately
    user.refreshToken = undefined;
    await user.save({ validateBeforeSave: false });
    res.clearCookie('refreshToken');
    return next(
      new AppError('Compromised session detected. All sessions revoked. Please log in again.', 403)
    );
  }

  // 5. Rotate tokens: issue new Access Token and new Refresh Token
  const newAccessToken = signAccessToken(user._id, user.role);
  const newRefreshToken = signRefreshToken(user._id);

  // 6. Update token in database and send new cookie
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshTokenCookie(res, newRefreshToken);

  res.status(200).json({
    status: 'success',
    accessToken: newAccessToken,
  });
});

// POST /api/auth/logout
exports.logout = catchAsync(async (req, res, next) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (incomingRefreshToken) {
    // Nullify the refresh token in MongoDB
    await User.findOneAndUpdate(
      { refreshToken: incomingRefreshToken },
      { refreshToken: null }
    );
  }

  // Clear cookie from the browser
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

// GET /api/auth/me
exports.getMe = catchAsync(async (req, res, next) => {
  // req.user is hydrated by the protect middleware
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});
