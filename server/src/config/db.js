const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
  }

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Reconnection will be attempted automatically.');
  });

  await mongoose.connect(uri);
};

module.exports = connectDB;
