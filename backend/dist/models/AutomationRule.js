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
exports.AutomationRuleModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const AutomationRuleSchema = new mongoose_1.Schema({
    ruleId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, index: true, default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    trigger: {
        event: {
            type: String,
            required: true,
            enum: [
                'task.created',
                'task.status_changed',
                'task.priority_changed',
                'sprint.started',
                'sprint.completed',
            ],
        },
        condition: {
            field: { type: String },
            operator: {
                type: String,
                enum: ['equals', 'not_equals', 'contains'],
                default: 'equals',
            },
            value: { type: String },
        },
    },
    actions: [
        {
            type: {
                type: String,
                required: true,
                enum: [
                    'assign_user',
                    'change_priority',
                    'change_status',
                    'send_notification',
                    'add_label',
                ],
            },
            params: { type: mongoose_1.Schema.Types.Mixed, default: {} },
        },
    ],
    executionCount: { type: Number, default: 0 },
    lastExecutedAt: { type: Date },
    createdBy: { type: String, required: true },
}, {
    timestamps: true,
});
AutomationRuleSchema.index({ tenantId: 1, projectId: 1, isActive: 1 });
exports.AutomationRuleModel = mongoose_1.default.models.AutomationRule ||
    mongoose_1.default.model('AutomationRule', AutomationRuleSchema);
exports.default = exports.AutomationRuleModel;
