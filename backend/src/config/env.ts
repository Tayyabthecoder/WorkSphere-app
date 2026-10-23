import dotenv from 'dotenv';

// Ensure .env variables are loaded
dotenv.config();

function getEnv(key: string, fallback: string): string {
  const value = process.env[key];
  if (value && value.trim() !== '') {
    return value.trim();
  }
  return fallback;
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '5001', 10),
  CORS_ORIGIN: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  CLIENT_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  MONGODB_URI:
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb+srv://tayyabthecoder_db_user:8joJEAgRr9OfUuMV@worksphere.jhx8dau.mongodb.net/worksphere?retryWrites=true&w=majority',
  JWT_SECRET: getEnv(
    'JWT_SECRET',
    'worksphere-jwt-access-secret-32chars-min-key!'
  ),
  JWT_REFRESH_SECRET: getEnv(
    'JWT_REFRESH_SECRET',
    'worksphere-jwt-refresh-secret-32chars-min-key!'
  ),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

export default ENV;
