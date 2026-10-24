"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Tenant_js_1 = require("../models/Tenant.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        let slug = req.headers['x-tenant-slug'] || req.query.workspace;
        if (!slug) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'TENANT_REQUIRED', message: 'Workspace context missing' }, 400);
        }
        const tenant = (await Tenant_js_1.TenantModel.findOne({ slug: slug.toLowerCase() }).lean());
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'TENANT_NOT_FOUND', message: 'Workspace not found' }, 404);
        }
        const rawSettings = (tenant.settings || {});
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            tenantId: tenant.tenantId,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            logoUrl: tenant.logoUrl,
            timezone: tenant.timezone || 'UTC',
            language: tenant.language || 'en',
            country: tenant.country || '',
            settings: {
                currency: rawSettings.currency || 'USD',
                currencySymbol: rawSettings.currencySymbol || '$',
                dateFormat: rawSettings.dateFormat || 'MM/DD/YYYY',
                plan: rawSettings.plan || 'Free',
            },
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error, 500);
    }
});
exports.default = router;
