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
exports.ProjectModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProjectSchema = new mongoose_1.Schema({
    projectId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    methodology: {
        type: String,
        enum: ['Agile', 'Waterfall', 'Hybrid'],
        default: 'Agile',
        index: true,
    },
    status: {
        type: String,
        enum: ['Active', 'On Hold', 'Completed', 'Archived'],
        default: 'Active',
        index: true,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    colorLabel: { type: String, default: '#1B4D3E' },
    budget: {
        total: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        type: { type: String, enum: ['fixed', 'hourly'], default: 'fixed' },
    },
    clientId: { type: String, default: null, index: true },
    members: [
        {
            userId: { type: String, required: true },
            role: { type: String, enum: ['manager', 'member', 'viewer'], default: 'member' },
        },
    ],
    phases: [
        {
            id: { type: String, required: true },
            name: { type: String, required: true },
            startDate: { type: Date },
            endDate: { type: Date },
            color: { type: String },
        },
    ],
}, {
    timestamps: true,
});
ProjectSchema.index({ tenantId: 1, status: 1 });
ProjectSchema.index({ tenantId: 1, clientId: 1 });
ProjectSchema.index({ tenantId: 1, projectId: 1 }, { unique: true });
exports.ProjectModel = mongoose_1.default.models.Project || mongoose_1.default.model('Project', ProjectSchema);
exports.default = exports.ProjectModel;
