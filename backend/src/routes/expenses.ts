import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ExpenseModel } from '../models/Expense.js';
import { ProjectModel } from '../models/Project.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { convertCurrency, CURRENCY_RATES } from '../utils/currency.js';
import { sendApiResponse, sendApiError } from '../utils/apiResponse.js';
import { verifyAuth } from '../middleware/auth.js';
import { assertPermission } from '../middleware/rbac.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

const router = Router();
router.use(verifyAuth);

const CreateExpenseSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.string().optional().default('USD'),
  vendor: z.string().min(1, 'Vendor is required').max(100),
  category: z.enum(['Labor', 'Tools', 'Travel', 'Other']).optional().default('Other'),
  date: z.string().optional(),
  description: z.string().optional().default(''),
});

// GET /api/v1/expenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const { projectId, category, startDate, endDate, page = '1', limit = '100' } = req.query;

    const query: Record<string, any> = { tenantId: user.tenantId };
    if (projectId) query.projectId = projectId;
    if (category && category !== 'ALL') query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
      ExpenseModel.find(query).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
      ExpenseModel.countDocuments(query),
    ]);

    // Batch-enrich project names in a single query to eliminate N+1 latency
    const projectIds = [...new Set(expenses.map((e) => e.projectId).filter(Boolean))];
    const projects = (await ProjectModel.find({
      tenantId: user.tenantId,
      projectId: { $in: projectIds },
    }).select('projectId name').lean()) as any[];

    const projectMap = new Map((projects || []).map((p) => [p.projectId, p.name]));
    const enriched = expenses.map((exp) => ({
      ...exp,
      projectName: projectMap.get(exp.projectId) || 'Unknown Project',
    }));

    const totalSpent = expenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
    const categoryBreakdown = { Labor: 0, Tools: 0, Travel: 0, Other: 0 };
    for (const exp of expenses) {
      const cat = exp.category as keyof typeof categoryBreakdown;
      const amt = exp.convertedAmount || exp.amount || 0;
      if (categoryBreakdown[cat] !== undefined) categoryBreakdown[cat] += amt;
      else categoryBreakdown.Other += amt;
    }

    return sendApiResponse(
      res,
      {
        expenses: enriched,
        totalSpent,
        categoryBreakdown,
      },
      200,
      { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    );
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// POST /api/v1/expenses
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const parseResult = CreateExpenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendApiError(res, new ValidationError('Invalid expense data', parseResult.error.flatten().fieldErrors), 422);
    }

    const data = parseResult.data;
    const expenseId = generateId('expense');
    const currency = data.currency || 'USD';
    const convertedAmount = convertCurrency(data.amount, currency, 'USD');
    const fxRateAtEntry = CURRENCY_RATES[currency] || 1.0;

    const expense = await ExpenseModel.create({
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

    await ActivityLogModel.create({
      logId: generateId('log'),
      tenantId: user.tenantId,
      projectId: data.projectId,
      userId: user.userId,
      action: 'logged_expense',
      entityType: 'expense',
      entityId: expenseId,
      metadata: { amount: data.amount, vendor: data.vendor, category: data.category },
    });

    return sendApiResponse(res, expense, 201);
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

// DELETE /api/v1/expenses/:expenseId
router.delete('/:expenseId', async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    assertPermission(user.role, 'project:update');

    const expense = await ExpenseModel.findOneAndDelete({
      tenantId: user.tenantId,
      expenseId: req.params.expenseId,
    }).lean();

    if (!expense) {
      return sendApiError(res, new NotFoundError('Expense not found'), 404);
    }

    return sendApiResponse(res, { message: 'Expense deleted successfully' });
  } catch (error: any) {
    return sendApiError(res, error);
  }
});

export default router;
