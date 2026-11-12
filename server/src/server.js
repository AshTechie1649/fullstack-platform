const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;
let server;

// Connect to Database first, then start listening
const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error('CRITICAL: Failed to initialize database connection:', err.message);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown helper
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed cleanly.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down gracefully...', err.name, err.message);
  gracefulShutdown('unhandledRejection');
});
