"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnouncementModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AnnouncementSchema = new mongoose_1.Schema({
    announcementId: { type: String, required: true, unique: true, index: true },
    type: {
        type: String,
        enum: ['info', 'warning', 'maintenance', 'feature'],
        default: 'info',
        index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    targetAudience: {
        type: String,
        enum: ['all', 'specific'],
        default: 'all',
        index: true,
    },
    targetTenantIds: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    scheduledAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, index: true },
    createdByUserId: { type: String, required: true },
}, {
    timestamps: true,
});
AnnouncementSchema.index({ isActive: 1, scheduledAt: -1, expiresAt: 1 });
exports.AnnouncementModel = mongoose_1.default.models.Announcement ||
    mongoose_1.default.model('Announcement', AnnouncementSchema);
exports.default = exports.AnnouncementModel;
