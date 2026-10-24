"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAuth = verifyAuth;
exports.verifyTenantActive = verifyTenantActive;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Tenant_js_1 = require("../models/Tenant.js");
const errors_js_1 = require("../utils/errors.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const env_js_1 = require("../config/env.js");
function verifyAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.UnauthorizedError('Authentication token required'), 401);
    }
    const token = authHeader.split(' ')[1];
    const secret = env_js_1.ENV.JWT_SECRET;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = {
            id: decoded.id || decoded.userId,
            userId: decoded.userId || decoded.id,
            name: decoded.name,
            email: decoded.email,
            tenantId: decoded.tenantId,
            role: decoded.role,
            impersonated: !!decoded.impersonated,
            impersonatedBy: decoded.impersonatedBy,
            impersonationSessionId: decoded.impersonationSessionId,
        };
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'TOKEN_EXPIRED', message: 'Token has expired' }, 401);
        }
        return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.UnauthorizedError('Invalid authentication token'), 401);
    }
}
async function verifyTenantActive(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.UnauthorizedError('Authentication required'), 401);
        }
        // SuperAdmin has platform-wide authority
        if (user.role === 'superAdmin') {
            return next();
        }
        if (user.tenantId === 'pending') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'WORKSPACE_PENDING', message: 'Workspace onboarding incomplete' }, 403);
        }
        const tenant = (await Tenant_js_1.TenantModel.findOne({ tenantId: user.tenantId }).select('status').lean());
        if (!tenant || tenant.status !== 'active') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'TENANT_INACTIVE', message: 'Workspace is suspended, archived, or does not exist' }, 403);
        }
        next();
    }
    catch (err) {
        return (0, apiResponse_js_1.sendApiError)(res, { code: 'SERVER_ERROR', message: 'Failed to verify workspace status' }, 500);
    }
}
