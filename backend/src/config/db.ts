import mongoose from 'mongoose';
import { ENV } from './env.js';

const MONGODB_URI = ENV.MONGODB_URI;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    const conn = await mongoose.connect(MONGODB_URI, opts);
    console.log(`[MERN Backend DB] Connected successfully to MongoDB: ${MONGODB_URI}`);
    return conn;
  } catch (err) {
    console.error(`[MERN Backend DB Error] Failed to connect to MongoDB at ${MONGODB_URI}:`, err);
    throw err;
  }
}

export default connectDB;
