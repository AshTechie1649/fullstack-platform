const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect, restrictTo } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validations/authValidation');

const router = express.Router();

// Public Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected Route (Any authenticated user)
router.get('/me', protect, authController.getMe);

// Protected + Restricted Route (Admin only)
router.get(
  '/admin-dashboard',
  protect,
  restrictTo('admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Welcome to the Admin Control Panel',
      data: {
        adminUser: req.user.name,
      },
    });
  }
);

module.exports = router;
