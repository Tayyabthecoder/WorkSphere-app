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
exports.TaskModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TaskSchema = new mongoose_1.Schema({
    taskId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    parentTaskId: { type: String, default: null, index: true },
    sprintId: { type: String, default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
        type: String,
        default: 'To Do',
        index: true,
    },
    priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low'],
        default: 'medium',
        index: true,
    },
    assignees: [{ type: String, index: true }],
    dueDate: { type: Date, index: true },
    startDate: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    storyPoints: { type: Number, default: 0 },
    customFields: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    dependencies: [
        {
            taskId: { type: String, required: true },
            type: {
                type: String,
                enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
                default: 'finish-to-start',
            },
        },
    ],
    labels: [{ type: String }],
    order: { type: Number, default: 0 },
    completedAt: { type: Date },
}, {
    timestamps: true,
});
// Compound indexes for performant queries
TaskSchema.index({ tenantId: 1, projectId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, assignees: 1, dueDate: 1 });
TaskSchema.index({ tenantId: 1, sprintId: 1 });
TaskSchema.index({ tenantId: 1, sprintId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, taskId: 1 }, { unique: true });
exports.TaskModel = mongoose_1.default.models.Task || mongoose_1.default.model('Task', TaskSchema);
exports.default = exports.TaskModel;
