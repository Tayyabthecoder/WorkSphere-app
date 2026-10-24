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
exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UserSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    refreshTokenHash: { type: String, select: false, default: null },
    resetPasswordTokenHash: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, default: null },
    name: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    role: {
        type: String,
        enum: ['superAdmin', 'orgAdmin', 'managingDirector', 'hr', 'manager', 'teamLeader', 'member', 'viewer'],
        default: 'member',
        index: true,
    },
    provider: { type: String, enum: ['email', 'google'], default: 'email' },
    emailVerified: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true, index: true },
    department: { type: String },
    teamId: { type: String, default: null, index: true },
    reportsToUserId: { type: String, default: null, index: true },
    jobTitle: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    notificationPrefs: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, {
    timestamps: true,
});
// Compound index for unique email within tenant, plus fast role lookup
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, role: 1 });
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
exports.default = exports.UserModel;
