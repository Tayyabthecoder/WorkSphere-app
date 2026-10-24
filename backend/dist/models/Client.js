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
exports.ClientModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ClientSchema = new mongoose_1.Schema({
    clientId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true, default: '' },
    primaryEmail: { type: String, trim: true, lowercase: true, default: '' },
    companyLogoUrl: { type: String, default: '' },
    portalToken: { type: String, required: true, unique: true, index: true },
    isPortalActive: { type: Boolean, default: true, index: true },
    portalSettings: {
        allowOverview: { type: Boolean, default: true },
        allowTimeline: { type: Boolean, default: true },
        allowDeliverables: { type: Boolean, default: true },
        allowFinancialSummary: { type: Boolean, default: false },
    },
    createdBy: { type: String, required: true },
}, {
    timestamps: true,
});
ClientSchema.index({ tenantId: 1, name: 1 });
ClientSchema.index({ tenantId: 1, isPortalActive: 1 });
exports.ClientModel = mongoose_1.default.models.Client || mongoose_1.default.model('Client', ClientSchema);
exports.default = exports.ClientModel;
