"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const Client_js_1 = require("../models/Client.js");
const id_js_1 = require("../utils/id.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Client name is required').max(100),
    company: zod_1.z.string().max(100).optional(),
    primaryEmail: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
    companyLogoUrl: zod_1.z.string().url('Invalid logo URL').optional().or(zod_1.z.literal('')),
});
const UpdateClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    company: zod_1.z.string().max(100).optional(),
    primaryEmail: zod_1.z.string().email('Invalid email address').optional().or(zod_1.z.literal('')),
    companyLogoUrl: zod_1.z.string().url('Invalid logo URL').optional().or(zod_1.z.literal('')),
    isPortalActive: zod_1.z.boolean().optional(),
    portalSettings: zod_1.z
        .object({
        allowOverview: zod_1.z.boolean().optional(),
        allowTimeline: zod_1.z.boolean().optional(),
        allowDeliverables: zod_1.z.boolean().optional(),
        allowFinancialSummary: zod_1.z.boolean().optional(),
    })
        .optional(),
});
router.get('/', async (req, res) => {
    try {
        (0, rbac_js_1.assertPermission)(req.user.role, 'client:read');
        const clients = await Client_js_1.ClientModel.find({ tenantId: req.user.tenantId }).sort({ name: 1 }).lean();
        return (0, apiResponse_js_1.sendApiResponse)(res, clients);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
router.post('/', async (req, res) => {
    try {
        (0, rbac_js_1.assertPermission)(req.user.role, 'client:create');
        const validated = CreateClientSchema.parse(req.body);
        const clientId = (0, id_js_1.generateId)('client');
        const portalToken = crypto_1.default.randomBytes(32).toString('hex');
        const client = await Client_js_1.ClientModel.create({
            clientId,
            tenantId: req.user.tenantId,
            name: validated.name,
            company: validated.company || '',
            primaryEmail: validated.primaryEmail || '',
            companyLogoUrl: validated.companyLogoUrl || '',
            portalToken,
            isPortalActive: true,
            portalSettings: {
                allowOverview: true,
                allowTimeline: true,
                allowDeliverables: true,
                allowFinancialSummary: false,
            },
            createdBy: req.user.userId,
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, client, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
router.put('/:clientId', async (req, res) => {
    try {
        (0, rbac_js_1.assertPermission)(req.user.role, 'client:update');
        const validated = UpdateClientSchema.parse(req.body);
        const client = await Client_js_1.ClientModel.findOneAndUpdate({ tenantId: req.user.tenantId, clientId: req.params.clientId }, {
            $set: {
                ...(validated.name !== undefined && { name: validated.name }),
                ...(validated.company !== undefined && { company: validated.company }),
                ...(validated.primaryEmail !== undefined && { primaryEmail: validated.primaryEmail }),
                ...(validated.companyLogoUrl !== undefined && { companyLogoUrl: validated.companyLogoUrl }),
                ...(validated.isPortalActive !== undefined && { isPortalActive: validated.isPortalActive }),
                ...(validated.portalSettings !== undefined && { portalSettings: validated.portalSettings }),
            },
        }, { new: true }).lean();
        if (!client) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Client not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, client);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
router.delete('/:clientId', async (req, res) => {
    try {
        (0, rbac_js_1.assertPermission)(req.user.role, 'client:delete');
        const client = await Client_js_1.ClientModel.findOneAndDelete({
            tenantId: req.user.tenantId,
            clientId: req.params.clientId,
        }).lean();
        if (!client) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Client not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Client deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
