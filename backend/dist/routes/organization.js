"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Tenant_js_1 = require("../models/Tenant.js");
const User_js_1 = require("../models/User.js");
const Project_js_1 = require("../models/Project.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const currency_js_1 = require("../utils/currency.js");
const id_js_1 = require("../utils/id.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
// GET /api/v1/organization
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        const [tenant, userCount, projectCount] = await Promise.all([
            Tenant_js_1.TenantModel.findOne({ tenantId: user.tenantId }).lean(),
            User_js_1.UserModel.countDocuments({ tenantId: user.tenantId, isActive: true }),
            Project_js_1.ProjectModel.countDocuments({ tenantId: user.tenantId, status: { $ne: 'Archived' } }),
        ]);
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'Organization not found' }, 404);
        }
        const isOrgAdmin = user.role === 'orgAdmin' || user.role === 'superAdmin';
        if (!isOrgAdmin) {
            return (0, apiResponse_js_1.sendApiResponse)(res, {
                tenantId: tenant.tenantId,
                name: tenant.name,
                slug: tenant.slug,
                status: tenant.status,
                logoUrl: tenant.logoUrl,
                timezone: tenant.timezone || 'UTC',
                language: tenant.language || 'en',
                country: tenant.country || '',
            });
        }
        const settings = (tenant.settings || {});
        const plan = 'Free';
        const storageUsedGB = +((projectCount * 0.4 + userCount * 0.1).toFixed(2));
        const orgCurrency = settings.currency || 'USD';
        const orgSymbol = settings.currencySymbol || currency_js_1.CURRENCY_SYMBOLS[orgCurrency] || '$';
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            tenantId: tenant.tenantId,
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            logoUrl: tenant.logoUrl,
            timezone: tenant.timezone || 'UTC',
            language: tenant.language || 'en',
            country: tenant.country || settings.country || '',
            plan,
            currency: orgCurrency,
            currencySymbol: orgSymbol,
            dateFormat: settings.dateFormat || 'MM/DD/YYYY',
            enforce2FA: !!settings.enforce2FA,
            restrictDomain: !!settings.restrictDomain,
            allowedDomain: settings.allowedDomain || '',
            featureFlags: tenant.settings?.featureFlags || {},
            usage: {
                users: userCount,
                projects: projectCount,
                storageGB: storageUsedGB,
            },
            createdAt: tenant.createdAt,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// PATCH /api/v1/organization
router.patch('/', async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== 'orgAdmin' && user.role !== 'superAdmin') {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'FORBIDDEN', message: 'Organization Administrator permissions required' }, 403);
        }
        const { name, logoUrl, timezone, language, country, currency, currencySymbol, dateFormat, enforce2FA, restrictDomain, allowedDomain, } = req.body;
        const tenant = await Tenant_js_1.TenantModel.findOne({ tenantId: user.tenantId });
        if (!tenant) {
            return (0, apiResponse_js_1.sendApiError)(res, { code: 'NOT_FOUND', message: 'Organization not found' }, 404);
        }
        if (name)
            tenant.name = name.trim();
        if (logoUrl !== undefined)
            tenant.logoUrl = logoUrl;
        if (timezone)
            tenant.timezone = timezone;
        if (language)
            tenant.language = language;
        if (country !== undefined)
            tenant.country = country;
        const currentSettings = (tenant.settings || {});
        const resolvedSymbol = currencySymbol || (currency ? currency_js_1.CURRENCY_SYMBOLS[currency] : undefined);
        tenant.settings = {
            ...currentSettings,
            ...(country !== undefined && { country }),
            ...(currency !== undefined && { currency }),
            ...(resolvedSymbol !== undefined && { currencySymbol: resolvedSymbol }),
            ...(dateFormat !== undefined && { dateFormat }),
            ...(enforce2FA !== undefined && { enforce2FA: Boolean(enforce2FA) }),
            ...(restrictDomain !== undefined && { restrictDomain: Boolean(restrictDomain) }),
            ...(allowedDomain !== undefined && { allowedDomain }),
        };
        tenant.updatedAt = new Date();
        await tenant.save();
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('act'),
            tenantId: user.tenantId,
            userId: user.id,
            action: 'updated_org_settings',
            entityType: 'project',
            entityId: user.tenantId,
            metadata: { name: tenant.name, timezone: tenant.timezone },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Organization settings updated successfully', tenant });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
