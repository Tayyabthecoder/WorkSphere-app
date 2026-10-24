"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
const MONGODB_URI = env_js_1.ENV.MONGODB_URI;
// In local development, fall back to public DNS if local ISP blocks SRV records.
// In cloud/serverless environments (Vercel), DO NOT override DNS as external UDP port 53 to 8.8.8.8 is blocked by cloud security groups.
if (!process.env.VERCEL && MONGODB_URI && MONGODB_URI.startsWith('mongodb+srv://')) {
    try {
        dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
    }
    catch {
        // Ignore if running in a restricted runtime
    }
}
let cachedPromise = null;
async function connectDB() {
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    if (cachedPromise) {
        return cachedPromise;
    }
    try {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
        };
        cachedPromise = mongoose_1.default
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
    }
    catch (err) {
        cachedPromise = null;
        throw err;
    }
}
exports.default = connectDB;
