const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };
    if (process.env.MONGODB_DB) options.dbName = process.env.MONGODB_DB;

    if (!uri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
    }

    const conn = await mongoose.connect(uri, options);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

module.exports = connectDB;
