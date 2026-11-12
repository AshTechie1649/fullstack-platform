const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS
app.use(cors());

// 3. HTTP Request Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 4. Rate Limiting (100 requests per 15 min per IP)
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes',
});
app.use('/api', limiter);

// 5. Body Parser
app.use(express.json({ limit: '10kb' }));

// 6. Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// const Product = require('./models/Product');
// const validate = require('./middleware/validate');
// const { createProductSchema } = require('./validations/productValidation');
// const catchAsync = require('./utils/catchAsync');

// // Route verifying Zod validation -> Mongoose model -> MongoDB Atlas write
// app.post(
//   '/api/test-product-create',
//   validate(createProductSchema),
//   catchAsync(async (req, res) => {
//     const product = await Product.create(req.body);
//     res.status(201).json({
//       status: 'success',
//       data: { product },
//     });
//   })
// );

// 7. Test Route for Operational Error
app.get('/api/test-error', (req, res, next) => {
  next(new AppError('Intentional operational error verification', 400));
});

// 8. 404 Catch-All (Compatible with Express 5 / path-to-regexp v7+)
app.all('{*path}', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// 9. Centralized Error Handler
app.use(globalErrorHandler);

module.exports = app;