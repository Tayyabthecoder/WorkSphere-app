import { Router, Request, Response } from 'express';
import { ProjectModel } from '../models/Project.js';
import { ExpenseModel } from '../models/Expense.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();
router.use(verifyAuth);

// GET /api/v1/budget/summary
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId } = req.query;

    const projectQuery: Record<string, any> = { tenantId: user.tenantId, status: { $ne: 'Archived' } };
    const expenseQuery: Record<string, any> = { tenantId: user.tenantId };

    if (projectId) {
      projectQuery.projectId = projectId;
      expenseQuery.projectId = projectId;
    }

    const [projects, expenses] = await Promise.all([
      ProjectModel.find(projectQuery).lean(),
      ExpenseModel.find(expenseQuery).lean(),
    ]);

    const allocatedBudget = projects.reduce((sum, p) => sum + (p.budget?.total || 0), 0);
    const actualSpend = expenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
    const remainingBudget = Math.max(0, allocatedBudget - actualSpend);
    const percentUtilized = allocatedBudget > 0 ? Math.round((actualSpend / allocatedBudget) * 100) : 0;

    let thresholdStatus: 'normal' | 'warning' | 'critical' = 'normal';
    if (percentUtilized >= 95) thresholdStatus = 'critical';
    else if (percentUtilized >= 80) thresholdStatus = 'warning';

    const categoryBreakdown = {
      Labor: 0,
      Tools: 0,
      Travel: 0,
      Other: 0,
    };

    for (const exp of expenses) {
      const cat = exp.category as keyof typeof categoryBreakdown;
      const amt = exp.convertedAmount || exp.amount || 0;
      if (categoryBreakdown[cat] !== undefined) {
        categoryBreakdown[cat] += amt;
      } else {
        categoryBreakdown.Other += amt;
      }
    }

    const projectBreakdowns = projects.map((p) => {
      const pExpenses = expenses.filter((e) => e.projectId === p.projectId);
      const spent = pExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
      const allocated = p.budget?.total || 0;
      const remaining = Math.max(0, allocated - spent);
      const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (pct >= 95) status = 'critical';
      else if (pct >= 80) status = 'warning';

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

    return sendApiResponse(res, {
      allocatedBudget,
      actualSpend,
      remainingBudget,
      percentUtilized,
      thresholdStatus,
      categoryBreakdown,
      projectBreakdowns,
    });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
