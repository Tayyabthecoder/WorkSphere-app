"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Project_js_1 = require("../models/Project.js");
const Expense_js_1 = require("../models/Expense.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
// GET /api/v1/budget/summary
router.get('/summary', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'budget:read');
        const { projectId } = req.query;
        const projectQuery = { tenantId: user.tenantId, status: { $ne: 'Archived' } };
        const expenseQuery = { tenantId: user.tenantId };
        if (projectId) {
            projectQuery.projectId = projectId;
            expenseQuery.projectId = projectId;
        }
        const [projects, expenses] = await Promise.all([
            Project_js_1.ProjectModel.find(projectQuery).lean(),
            Expense_js_1.ExpenseModel.find(expenseQuery).lean(),
        ]);
        const allocatedBudget = projects.reduce((sum, p) => sum + (p.budget?.total || 0), 0);
        const actualSpend = expenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
        const remainingBudget = Math.max(0, allocatedBudget - actualSpend);
        const percentUtilized = allocatedBudget > 0 ? Math.round((actualSpend / allocatedBudget) * 100) : 0;
        let thresholdStatus = 'normal';
        if (percentUtilized >= 95)
            thresholdStatus = 'critical';
        else if (percentUtilized >= 80)
            thresholdStatus = 'warning';
        const categoryBreakdown = {
            Labor: 0,
            Tools: 0,
            Travel: 0,
            Other: 0,
        };
        for (const exp of expenses) {
            const cat = exp.category;
            const amt = exp.convertedAmount || exp.amount || 0;
            if (categoryBreakdown[cat] !== undefined) {
                categoryBreakdown[cat] += amt;
            }
            else {
                categoryBreakdown.Other += amt;
            }
        }
        const projectBreakdowns = projects.map((p) => {
            const pExpenses = expenses.filter((e) => e.projectId === p.projectId);
            const spent = pExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
            const allocated = p.budget?.total || 0;
            const remaining = Math.max(0, allocated - spent);
            const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            let status = 'normal';
            if (pct >= 95)
                status = 'critical';
            else if (pct >= 80)
                status = 'warning';
            return {
                projectId: p.projectId,
                name: p.name,
                colorLabel: p.colorLabel || '#1B4D3E',
                allocated,
                spent,
                remaining,
                percentUtilized: pct,
                thresholdStatus: status,
                currency: p.budget?.currency || 'USD',
            };
        });
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            allocatedBudget,
            actualSpend,
            remainingBudget,
            percentUtilized,
            thresholdStatus,
            categoryBreakdown,
            projectBreakdowns,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
