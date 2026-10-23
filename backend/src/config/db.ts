import dns from 'dns';
import mongoose from 'mongoose';
import { ENV } from './env.js';

const MONGODB_URI = ENV.MONGODB_URI;

// Ensure MongoDB SRV records resolve reliably across all networks and serverless environments
if (MONGODB_URI && MONGODB_URI.startsWith('mongodb+srv://')) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch {
    // Ignore if running in a restricted runtime
  }
}

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    };

    cachedPromise = mongoose
      .connect(MONGODB_URI, opts)
      .then((conn) => {
        console.log(`[MERN Backend DB] Connected successfully to MongoDB`);
        return conn;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error(`[MERN Backend DB Error] Failed to connect to MongoDB:`, err.message || err);
        throw err;
      });

    return await cachedPromise;
  } catch (err) {
    cachedPromise = null;
    throw err;
  }
}

export default connectDB;
