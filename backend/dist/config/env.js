"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
// Ensure .env variables are loaded
dotenv_1.default.config();
function getEnv(key, fallback) {
    const value = process.env[key];
    if (value && value.trim() !== '') {
        return value.trim();
    }
    return fallback;
}
exports.ENV = {
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: parseInt(process.env.PORT || '5001', 10),
    CORS_ORIGIN: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
    CLIENT_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
    MONGODB_URI: process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        'mongodb+srv://tayyabthecoder_db_user:8joJEAgRr9OfUuMV@worksphere.jhx8dau.mongodb.net/worksphere?retryWrites=true&w=majority',
    JWT_SECRET: getEnv('JWT_SECRET', 'worksphere-jwt-access-secret-32chars-min-key!'),
    JWT_REFRESH_SECRET: getEnv('JWT_REFRESH_SECRET', 'worksphere-jwt-refresh-secret-32chars-min-key!'),
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};
exports.default = exports.ENV;
