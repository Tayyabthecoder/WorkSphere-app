import dotenv from 'dotenv';

// Ensure .env variables are loaded
dotenv.config();

function requireEnv(key: string, customMessage?: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      customMessage ||
        `[Environment Error] Missing required environment variable: ${key}. Please configure it in your .env file.`
    );
  }
  return value.trim();
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  CORS_ORIGIN: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  CLIENT_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  MONGODB_URI:
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/worksphere',
  JWT_SECRET: requireEnv(
    'JWT_SECRET',
    'FATAL: JWT_SECRET environment variable is missing! A secure random secret is required to run WorkSphere.'
  ),
  JWT_REFRESH_SECRET: requireEnv(
    'JWT_REFRESH_SECRET',
    'FATAL: JWT_REFRESH_SECRET environment variable is missing! A secure random refresh secret is required to run WorkSphere.'
  ),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

export default ENV;
