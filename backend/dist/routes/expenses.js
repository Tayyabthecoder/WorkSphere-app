"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const Expense_js_1 = require("../models/Expense.js");
const Project_js_1 = require("../models/Project.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const currency_js_1 = require("../utils/currency.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const errors_js_1 = require("../utils/errors.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
const CreateExpenseSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1, 'Project ID is required'),
    amount: zod_1.z.number().min(0.01, 'Amount must be greater than 0'),
    currency: zod_1.z.string().optional().default('USD'),
    vendor: zod_1.z.string().min(1, 'Vendor is required').max(100),
    category: zod_1.z.enum(['Labor', 'Tools', 'Travel', 'Other']).optional().default('Other'),
    date: zod_1.z.string().optional(),
    description: zod_1.z.string().optional().default(''),
});
// GET /api/v1/expenses
router.get('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'budget:read');
        const { projectId, category, startDate, endDate, page = '1', limit = '100' } = req.query;
        const query = { tenantId: user.tenantId };
        if (projectId)
            query.projectId = projectId;
        if (category && category !== 'ALL')
            query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate)
                query.date.$gte = new Date(startDate);
            if (endDate)
                query.date.$lte = new Date(endDate);
        }
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const [expenses, total] = await Promise.all([
            Expense_js_1.ExpenseModel.find(query).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
            Expense_js_1.ExpenseModel.countDocuments(query),
        ]);
        // Batch-enrich project names in a single query to eliminate N+1 latency
        const projectIds = [...new Set(expenses.map((e) => e.projectId).filter(Boolean))];
        const projects = (await Project_js_1.ProjectModel.find({
            tenantId: user.tenantId,
            projectId: { $in: projectIds },
        }).select('projectId name').lean());
        const projectMap = new Map((projects || []).map((p) => [p.projectId, p.name]));
        const enriched = expenses.map((exp) => ({
            ...exp,
            projectName: projectMap.get(exp.projectId) || 'Unknown Project',
        }));
        const totalSpent = expenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
        const categoryBreakdown = { Labor: 0, Tools: 0, Travel: 0, Other: 0 };
        for (const exp of expenses) {
            const cat = exp.category;
            const amt = exp.convertedAmount || exp.amount || 0;
            if (categoryBreakdown[cat] !== undefined)
                categoryBreakdown[cat] += amt;
            else
                categoryBreakdown.Other += amt;
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            expenses: enriched,
            totalSpent,
            categoryBreakdown,
        }, 200, { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// POST /api/v1/expenses
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'budget:write');
        const parseResult = CreateExpenseSchema.safeParse(req.body);
        if (!parseResult.success) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.ValidationError('Invalid expense data', parseResult.error.flatten().fieldErrors), 422);
        }
        const data = parseResult.data;
        const expenseId = (0, id_js_1.generateId)('expense');
        const currency = data.currency || 'USD';
        const convertedAmount = (0, currency_js_1.convertCurrency)(data.amount, currency, 'USD');
        const fxRateAtEntry = currency_js_1.CURRENCY_RATES[currency] || 1.0;
        const expense = await Expense_js_1.ExpenseModel.create({
            expenseId,
            tenantId: user.tenantId,
            projectId: data.projectId,
            amount: data.amount,
            currency,
            convertedAmount,
            baseCurrency: 'USD',
            fxRateAtEntry,
            fxRateDate: new Date(),
            date: data.date ? new Date(data.date) : new Date(),
            vendor: data.vendor,
            category: data.category,
            description: data.description,
            createdBy: user.userId,
        });
        await ActivityLog_js_1.ActivityLogModel.create({
            logId: (0, id_js_1.generateId)('log'),
            tenantId: user.tenantId,
            projectId: data.projectId,
            userId: user.userId,
            action: 'logged_expense',
            entityType: 'expense',
            entityId: expenseId,
            metadata: { amount: data.amount, vendor: data.vendor, category: data.category },
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, expense, 201);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// DELETE /api/v1/expenses/:expenseId
router.delete('/:expenseId', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'budget:write');
        const expense = await Expense_js_1.ExpenseModel.findOneAndDelete({
            tenantId: user.tenantId,
            expenseId: req.params.expenseId,
        }).lean();
        if (!expense) {
            return (0, apiResponse_js_1.sendApiError)(res, new errors_js_1.NotFoundError('Expense not found'), 404);
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, { message: 'Expense deleted successfully' });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
