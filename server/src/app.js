const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

const authRouter = require('./routes/authRoutes');

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. CORS configuration (credentials: true allows cookies over CORS)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

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

// 5. Body Parsers & Cookie Parser
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 6. Application Routes
app.use('/api/auth', authRouter);

// 7. Health Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// 8. 404 Catch-All
app.all('{*path}', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// 9. Centralized Error Handler
app.use(globalErrorHandler);

module.exports = app;