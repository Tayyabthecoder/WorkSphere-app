"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Project_js_1 = require("../models/Project.js");
const Task_js_1 = require("../models/Task.js");
const TimeEntry_js_1 = require("../models/TimeEntry.js");
const Expense_js_1 = require("../models/Expense.js");
const User_js_1 = require("../models/User.js");
const Sprint_js_1 = require("../models/Sprint.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const rbac_js_1 = require("../middleware/rbac.js");
const reportCache_js_1 = require("../utils/reportCache.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
router.get('/summary', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'report:read');
        const { timeHorizon = 'month', from, to, projectId } = req.query;
        const cacheKey = `report:${user.tenantId}:${projectId || 'all'}:${timeHorizon}:${from || ''}:${to || ''}`;
        const cached = (0, reportCache_js_1.getCached)(cacheKey);
        if (cached) {
            return (0, apiResponse_js_1.sendApiResponse)(res, cached);
        }
        const now = new Date();
        let startDate;
        const endDate = to ? new Date(to) : now;
        if (from) {
            startDate = new Date(from);
        }
        else if (timeHorizon === 'sprint') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 14);
        }
        else if (timeHorizon === 'quarter') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 90);
        }
        else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        // Scoped filters
        const projectFilter = { tenantId: user.tenantId };
        if (projectId)
            projectFilter.projectId = projectId;
        const taskMatch = { tenantId: user.tenantId };
        if (projectId)
            taskMatch.projectId = projectId;
        const expenseMatch = { tenantId: user.tenantId };
        if (projectId)
            expenseMatch.projectId = projectId;
        const timeFilter = {
            tenantId: user.tenantId,
            startTime: { $gte: startDate, $lte: endDate },
        };
        if (projectId)
            timeFilter.projectId = projectId;
        const sprintFilter = { tenantId: user.tenantId };
        if (projectId)
            sprintFilter.projectId = projectId;
        const [projects, users, sprints, activeSprintDoc, expenseAgg, monthlySpendAgg, taskFacetArr, timeFacetArr,] = await Promise.all([
            Project_js_1.ProjectModel.find(projectFilter)
                .select('projectId name colorLabel budget status')
                .lean(),
            User_js_1.UserModel.find({ tenantId: user.tenantId })
                .select('userId name email role avatarUrl')
                .lean(),
            Sprint_js_1.SprintModel.find(sprintFilter)
                .sort({ startDate: -1 })
                .limit(6)
                .lean(),
            Sprint_js_1.SprintModel.findOne({
                ...sprintFilter,
                status: 'active',
            }).lean(),
            Expense_js_1.ExpenseModel.aggregate([
                { $match: expenseMatch },
                {
                    $group: {
                        _id: '$projectId',
                        spent: { $sum: { $ifNull: ['$convertedAmount', '$amount'] } },
                    },
                },
            ]),
            Expense_js_1.ExpenseModel.aggregate([
                {
                    $match: {
                        ...expenseMatch,
                        $or: [
                            { date: { $gte: sixMonthsAgo } },
                            { createdAt: { $gte: sixMonthsAgo } },
                        ],
                    },
                },
                {
                    $project: {
                        amount: { $ifNull: ['$convertedAmount', '$amount'] },
                        expDate: { $ifNull: ['$date', '$createdAt'] },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$expDate' },
                            month: { $month: '$expDate' },
                        },
                        spend: { $sum: '$amount' },
                    },
                },
            ]),
            Task_js_1.TaskModel.aggregate([
                { $match: taskMatch },
                {
                    $facet: {
                        stats: [
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: 1 },
                                    completed: {
                                        $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                                    },
                                    inProgress: {
                                        $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] },
                                    },
                                },
                            },
                        ],
                        overdue: [
                            {
                                $match: {
                                    status: { $ne: 'Done' },
                                    dueDate: { $lt: now, $ne: null },
                                },
                            },
                            { $sort: { dueDate: 1 } },
                            { $limit: 10 },
                        ],
                        overdueTotal: [
                            {
                                $match: {
                                    status: { $ne: 'Done' },
                                    dueDate: { $lt: now, $ne: null },
                                },
                            },
                            { $count: 'count' },
                        ],
                        assigneeCounts: [
                            { $unwind: '$assignees' },
                            {
                                $group: {
                                    _id: '$assignees',
                                    activeTasks: {
                                        $sum: { $cond: [{ $ne: ['$status', 'Done'] }, 1, 0] },
                                    },
                                    completedTasks: {
                                        $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] },
                                    },
                                },
                            },
                        ],
                        projectEstimates: [
                            {
                                $group: {
                                    _id: '$projectId',
                                    estimatedHours: { $sum: { $ifNull: ['$estimatedHours', 0] } },
                                },
                            },
                        ],
                        sprintMetrics: [
                            { $match: { sprintId: { $ne: null } } },
                            {
                                $group: {
                                    _id: { sprintId: '$sprintId', isDone: { $eq: ['$status', 'Done'] } },
                                    points: { $sum: { $ifNull: ['$storyPoints', 0] } },
                                },
                            },
                        ],
                    },
                },
            ]),
            TimeEntry_js_1.TimeEntryModel.aggregate([
                {
                    $match: timeFilter,
                },
                {
                    $facet: {
                        userDurations: [
                            {
                                $group: {
                                    _id: '$userId',
                                    totalMinutes: { $sum: { $ifNull: ['$duration', 0] } },
                                },
                            },
                        ],
                        projectDurations: [
                            {
                                $group: {
                                    _id: '$projectId',
                                    totalMinutes: { $sum: { $ifNull: ['$duration', 0] } },
                                },
                            },
                        ],
                        billableSummary: [
                            {
                                $group: {
                                    _id: null,
                                    totalMinutes: { $sum: { $ifNull: ['$duration', 0] } },
                                    billableMinutes: {
                                        $sum: { $cond: [{ $eq: ['$isBillable', true] }, { $ifNull: ['$duration', 0] }, 0] },
                                    },
                                },
                            },
                        ],
                    },
                },
            ]),
        ]);
        const projectMap = new Map(projects.map((p) => [p.projectId, p.name]));
        const userMap = new Map(users.map((u) => [u.userId, u.name]));
        const totalProjects = projects.length;
        const activeProjects = projects.filter((p) => p.status === 'Active').length;
        const completedProjects = projects.filter((p) => p.status === 'Completed').length;
        const onHoldProjects = projects.filter((p) => p.status === 'On Hold').length;
        const taskFacet = taskFacetArr[0] || {};
        const taskStats = taskFacet.stats?.[0] || { total: 0, completed: 0, inProgress: 0 };
        const totalTasks = taskStats.total || 0;
        const completedTasks = taskStats.completed || 0;
        const inProgressTasks = taskStats.inProgress || 0;
        const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const overdueCount = taskFacet.overdueTotal?.[0]?.count || 0;
        const onTimeDeliveryRate = totalTasks > 0
            ? Math.max(0, Math.min(100, Math.round(((completedTasks) / Math.max(1, completedTasks + overdueCount)) * 100)))
            : 100;
        const totalAllocatedBudget = projects.reduce((sum, p) => sum + (p.budget?.total || 0), 0);
        const totalActualSpend = expenseAgg.reduce((sum, e) => sum + (e.spent || 0), 0);
        const budgetUtilization = totalAllocatedBudget > 0 ? Math.round((totalActualSpend / totalAllocatedBudget) * 100) : 0;
        const horizonDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        const expectedHoursPerPerson = (horizonDays / 7) * 40;
        const timeFacet = timeFacetArr[0] || {};
        const userDurationMap = new Map();
        for (const ud of timeFacet.userDurations || []) {
            userDurationMap.set(ud._id, ud.totalMinutes || 0);
        }
        const userTaskMap = new Map();
        for (const uc of taskFacet.assigneeCounts || []) {
            userTaskMap.set(uc._id, {
                activeTasks: uc.activeTasks || 0,
                completedTasks: uc.completedTasks || 0,
            });
        }
        const teamWorkload = users.map((u) => {
            const taskData = userTaskMap.get(u.userId) || { activeTasks: 0, completedTasks: 0 };
            const userMinutes = userDurationMap.get(u.userId) || 0;
            const userHours = +(userMinutes / 60).toFixed(1);
            const utilizationPct = expectedHoursPerPerson > 0 ? Math.round((userHours / expectedHoursPerPerson) * 100) : 0;
            const status = utilizationPct > 105 ? 'overloaded' : utilizationPct >= 75 ? 'heavy' : 'optimal';
            return {
                userId: u.userId,
                name: u.name,
                memberName: u.name,
                email: u.email,
                role: u.role,
                avatarUrl: u.avatarUrl,
                activeTasks: taskData.activeTasks,
                completedTasks: taskData.completedTasks,
                loggedHours: userHours,
                loggedHoursThisWeek: userHours,
                utilizationPct,
                status,
            };
        });
        const projectExpenseMap = new Map();
        for (const pe of expenseAgg) {
            projectExpenseMap.set(pe._id, pe.spent || 0);
        }
        const projectFinancials = projects.map((p) => {
            const projSpent = projectExpenseMap.get(p.projectId) || 0;
            const projAllocated = p.budget?.total || 0;
            return {
                projectId: p.projectId,
                name: p.name,
                projectName: p.name,
                colorLabel: p.colorLabel || '#1B4D3E',
                allocated: projAllocated,
                budget: projAllocated,
                spent: projSpent,
                actual: projSpent,
                variance: projAllocated - projSpent,
                percentUsed: projAllocated > 0 ? Math.round((projSpent / projAllocated) * 100) : 0,
            };
        });
        const atRiskTasks = (taskFacet.overdue || []).map((t) => {
            const due = t.dueDate ? new Date(t.dueDate) : now;
            const daysOverdue = Math.max(1, Math.round((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
            const priorityWeight = t.priority === 'critical' ? 40 : t.priority === 'high' ? 30 : 15;
            const riskScore = Math.min(99, priorityWeight + Math.min(50, daysOverdue * 5));
            const projName = projectMap.get(t.projectId) || 'General';
            const assigneesArr = t.assignees || [];
            const assigneeNames = assigneesArr.map((id) => userMap.get(id) || id).join(', ') || 'Unassigned';
            return {
                taskId: t.taskId,
                title: t.title,
                projectId: t.projectId,
                projectName: projName,
                priority: t.priority,
                status: t.status,
                dueDate: t.dueDate,
                assignees: t.assignees,
                assigneeName: assigneeNames,
                daysOverdue,
                riskReason: daysOverdue > 0 ? `${daysOverdue}d Overdue` : `${t.priority} Priority`,
                riskScore,
            };
        });
        const sprintDonePointsMap = new Map();
        for (const sm of taskFacet.sprintMetrics || []) {
            if (sm._id?.isDone) {
                sprintDonePointsMap.set(sm._id.sprintId, sm.points || 0);
            }
        }
        const velocityTrend = [...sprints].reverse().map((s) => {
            const completedPoints = sprintDonePointsMap.get(s.sprintId) || 0;
            const committedPoints = s.committedPoints || s.capacityPoints || completedPoints;
            return {
                sprintId: s.sprintId,
                name: s.name,
                sprintName: s.name,
                committedPoints,
                completedPoints,
                plannedPoints: committedPoints,
                deliveredPoints: completedPoints,
            };
        });
        // Compute average velocity across sprints
        const avgVelocity = velocityTrend.length > 0
            ? Math.round(velocityTrend.reduce((sum, v) => sum + v.completedPoints, 0) / velocityTrend.length)
            : 0;
        // Active Sprint Burn-Down Data Generation
        let burnDownData = [];
        const activeSprint = activeSprintDoc;
        if (activeSprint && !Array.isArray(activeSprint)) {
            const sStart = new Date(activeSprint.startDate);
            const sEnd = new Date(activeSprint.endDate);
            const sprintDays = Math.max(5, Math.min(30, Math.ceil((sEnd.getTime() - sStart.getTime()) / (1000 * 60 * 60 * 24)) + 1));
            const sprintTasks = await Task_js_1.TaskModel.find({
                tenantId: user.tenantId,
                sprintId: activeSprint.sprintId,
            }).select('storyPoints status').lean();
            const totalSprintPts = Math.max(activeSprint.capacityPoints || 0, sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0));
            const doneSprintPts = sprintTasks
                .filter((t) => t.status === 'Done')
                .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const remainingPts = Math.max(0, totalSprintPts - doneSprintPts);
            for (let day = 0; day < sprintDays; day++) {
                const curDate = new Date(sStart);
                curDate.setDate(sStart.getDate() + day);
                const dayLabel = curDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const ideal = Math.max(0, Math.round(totalSprintPts - (totalSprintPts / Math.max(1, sprintDays - 1)) * day));
                let actual = null;
                if (curDate <= now || day === 0) {
                    if (day === 0) {
                        actual = totalSprintPts;
                    }
                    else {
                        const passedDays = Math.max(1, Math.min(sprintDays, Math.ceil((now.getTime() - sStart.getTime()) / (1000 * 60 * 60 * 24))));
                        const progressRatio = Math.min(1, day / passedDays);
                        actual = Math.round(totalSprintPts - (totalSprintPts - remainingPts) * progressRatio);
                    }
                }
                burnDownData.push({
                    day: dayLabel,
                    date: curDate.toISOString().slice(0, 10),
                    ideal,
                    actual,
                });
            }
        }
        // 8. 24-Week Daily Activity Heatmap aggregation from real ActivityLogModel
        const twentyFourWeeksAgo = new Date(now);
        twentyFourWeeksAgo.setDate(now.getDate() - 24 * 7);
        twentyFourWeeksAgo.setHours(0, 0, 0, 0);
        const activityFilter = {
            tenantId: user.tenantId,
            createdAt: { $gte: twentyFourWeeksAgo },
        };
        if (projectId) {
            activityFilter.projectId = projectId;
        }
        const activityAgg = await ActivityLog_js_1.ActivityLogModel.aggregate([
            { $match: activityFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const activityHeatmap = activityAgg.map((a) => ({
            date: a._id,
            count: a.count,
        }));
        const billableData = timeFacet.billableSummary?.[0] || { totalMinutes: 0, billableMinutes: 0 };
        const totalMinutesLogged = billableData.totalMinutes || 0;
        const totalHoursLogged = +(totalMinutesLogged / 60).toFixed(1);
        const billableRatio = totalMinutesLogged > 0
            ? Math.round((billableData.billableMinutes / totalMinutesLogged) * 100)
            : 100;
        const projectEstimateMap = new Map();
        for (const pe of taskFacet.projectEstimates || []) {
            projectEstimateMap.set(pe._id, pe.estimatedHours || 0);
        }
        const projectDurationMap = new Map();
        for (const pd of timeFacet.projectDurations || []) {
            projectDurationMap.set(pd._id, pd.totalMinutes || 0);
        }
        const timeVsEstimate = projects.slice(0, 6).map((p) => {
            const estimatedHours = projectEstimateMap.get(p.projectId) || 0;
            const loggedMinutes = projectDurationMap.get(p.projectId) || 0;
            const actualHours = +(loggedMinutes / 60).toFixed(1);
            return {
                projectId: p.projectId,
                projectName: p.name.length > 14 ? `${p.name.slice(0, 14)}...` : p.name,
                estimatedHours,
                actualHours,
            };
        });
        const monthlyBurnMap = new Map();
        for (const mb of monthlySpendAgg) {
            if (mb._id) {
                const key = `${mb._id.year}-${mb._id.month}`;
                monthlyBurnMap.set(key, mb.spend || 0);
            }
        }
        const monthlyBurn = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            const monthLabel = d.toLocaleString('default', { month: 'short' });
            const year = d.getFullYear();
            const month = d.getMonth() + 1; // MongoDB $month is 1-indexed
            const spend = monthlyBurnMap.get(`${year}-${month}`) || 0;
            return {
                month: monthLabel,
                spend: Math.round(spend),
            };
        });
        // Predictive Analytics
        const trailing30Spend = monthlyBurn[monthlyBurn.length - 1]?.spend || 0;
        const dailyBurnRate = +(trailing30Spend / 30).toFixed(2);
        const remainingBudget = Math.max(0, totalAllocatedBudget - totalActualSpend);
        const budgetRunwayDays = dailyBurnRate > 0 ? Math.round(remainingBudget / dailyBurnRate) : null;
        const remainingBacklogTasks = Math.max(0, totalTasks - completedTasks);
        const payload = {
            timeHorizon,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            kpis: {
                totalProjects,
                activeProjects,
                completedProjects,
                onHoldProjects,
                totalTasks,
                completedTasks,
                inProgressTasks,
                taskCompletionRate,
                overdueCount,
                onTimeDeliveryRate,
                totalAllocatedBudget,
                totalActualSpend,
                budgetUtilization,
                budgetVariance: budgetUtilization,
                totalBudget: totalAllocatedBudget,
                averageVelocity: avgVelocity,
                billableRatio,
                totalHoursLogged,
            },
            teamWorkload,
            resourceUtilization: teamWorkload,
            projectFinancials,
            budgetVsActual: projectFinancials,
            riskWatchlist: atRiskTasks,
            atRiskTasks,
            velocityTrend,
            burnDownData,
            timeVsEstimate,
            monthlyBurn,
            activityHeatmap,
            predictions: {
                dailyBurnRate,
                remainingBudget,
                budgetRunwayDays,
                remainingBacklogTasks,
                estimatedSprintsToComplete: avgVelocity > 0 ? +(remainingBacklogTasks * 3 / avgVelocity).toFixed(1) : null,
            },
        };
        (0, reportCache_js_1.setCached)(cacheKey, payload, 5000);
        return (0, apiResponse_js_1.sendApiResponse)(res, payload);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
// GET /api/v1/reports/export
router.get('/export', async (req, res) => {
    try {
        const user = req.user;
        (0, rbac_js_1.assertPermission)(user.role, 'report:export');
        const { type = 'tasks' } = req.query;
        let csv = '';
        if (type === 'time') {
            const [entries, projects, tasks, users] = await Promise.all([
                TimeEntry_js_1.TimeEntryModel.find({ tenantId: user.tenantId }).sort({ startTime: -1 }).lean(),
                Project_js_1.ProjectModel.find({ tenantId: user.tenantId }).select('projectId name').lean(),
                Task_js_1.TaskModel.find({ tenantId: user.tenantId }).select('taskId title').lean(),
                User_js_1.UserModel.find({ tenantId: user.tenantId }).select('userId name').lean(),
            ]);
            const projectMap = new Map((projects || []).map((p) => [String(p.projectId), String(p.name || '')]));
            const taskMap = new Map((tasks || []).map((t) => [String(t.taskId), String(t.title || '')]));
            const userMap = new Map((users || []).map((u) => [String(u.userId), String(u.name || '')]));
            csv = 'Entry ID,Date,Member Name,Project,Task Title,Duration (Minutes),Hours,Billable,Description\n';
            for (const e of entries) {
                const dateStr = e.startTime ? new Date(e.startTime).toISOString().slice(0, 10) : '';
                const uName = userMap.get(e.userId) || String(e.userId);
                const pName = projectMap.get(e.projectId) || 'Unknown Project';
                const tTitle = taskMap.get(e.taskId) || 'Unknown Task';
                const hours = (e.duration / 60).toFixed(2);
                const desc = String(e.description || '').replace(/"/g, '""');
                csv += `"${e.entryId}","${dateStr}","${uName.replace(/"/g, '""')}","${pName.replace(/"/g, '""')}","${tTitle.replace(/"/g, '""')}",${e.duration},${hours},${e.isBillable ? 'Yes' : 'No'},"${desc}"\n`;
            }
        }
        else if (type === 'expenses') {
            const [expenses, projects] = await Promise.all([
                Expense_js_1.ExpenseModel.find({ tenantId: user.tenantId }).sort({ date: -1 }).lean(),
                Project_js_1.ProjectModel.find({ tenantId: user.tenantId }).select('projectId name').lean(),
            ]);
            const projectMap = new Map((projects || []).map((p) => [String(p.projectId), String(p.name || '')]));
            csv = 'Expense ID,Date,Project,Category,Vendor,Amount,Currency,Converted (USD),Description\n';
            for (const exp of expenses) {
                const dateStr = exp.date ? new Date(exp.date).toISOString().slice(0, 10) : '';
                const pName = projectMap.get(exp.projectId) || 'Unknown Project';
                const vendor = String(exp.vendor || '').replace(/"/g, '""');
                const desc = String(exp.description || '').replace(/"/g, '""');
                csv += `"${exp.expenseId}","${dateStr}","${pName.replace(/"/g, '""')}","${exp.category}","${vendor}",${exp.amount || 0},"${exp.currency || 'USD'}",${exp.convertedAmount || exp.amount || 0},"${desc}"\n`;
            }
        }
        else if (type === 'summary') {
            const [projects, tasks, expenses, timeEntries] = await Promise.all([
                Project_js_1.ProjectModel.find({ tenantId: user.tenantId }).lean(),
                Task_js_1.TaskModel.find({ tenantId: user.tenantId }).lean(),
                Expense_js_1.ExpenseModel.find({ tenantId: user.tenantId }).lean(),
                TimeEntry_js_1.TimeEntryModel.find({ tenantId: user.tenantId }).lean(),
            ]);
            csv = 'Project ID,Project Name,Status,Allocated Budget,Total Spent,Tasks Count,Completed Tasks,Logged Hours\n';
            for (const p of projects) {
                const pExpenses = expenses.filter((e) => e.projectId === p.projectId);
                const spent = pExpenses.reduce((sum, e) => sum + (e.convertedAmount || e.amount || 0), 0);
                const pTasks = tasks.filter((t) => t.projectId === p.projectId);
                const doneTasks = pTasks.filter((t) => t.status === 'Done');
                const pTime = timeEntries.filter((te) => te.projectId === p.projectId);
                const totalHours = (pTime.reduce((sum, te) => sum + (te.duration || 0), 0) / 60).toFixed(1);
                csv += `"${p.projectId}","${String(p.name || '').replace(/"/g, '""')}","${p.status}",${p.budget?.total || 0},${spent},${pTasks.length},${doneTasks.length},${totalHours}\n`;
            }
        }
        else {
            // Default: enriched tasks
            const [tasks, projects, users] = await Promise.all([
                Task_js_1.TaskModel.find({ tenantId: user.tenantId }).sort({ createdAt: -1 }).lean(),
                Project_js_1.ProjectModel.find({ tenantId: user.tenantId }).select('projectId name').lean(),
                User_js_1.UserModel.find({ tenantId: user.tenantId }).select('userId name').lean(),
            ]);
            const projectMap = new Map((projects || []).map((p) => [String(p.projectId), String(p.name || '')]));
            const userMap = new Map((users || []).map((u) => [String(u.userId), String(u.name || '')]));
            csv = 'Task ID,Title,Project,Assignee,Status,Priority,Story Points,Due Date,Created At\n';
            for (const t of tasks) {
                const pName = projectMap.get(t.projectId) || 'Unknown Project';
                const aName = t.assigneeId ? (userMap.get(t.assigneeId) || String(t.assigneeId)) : 'Unassigned';
                const dueDateStr = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '';
                const createdStr = t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : '';
                csv += `"${t.taskId}","${String(t.title || '').replace(/"/g, '""')}","${pName.replace(/"/g, '""')}","${aName.replace(/"/g, '""')}","${t.status}","${t.priority}",${t.storyPoints || 0},"${dueDateStr}","${createdStr}"\n`;
            }
        }
        const filename = `worksphere_${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.status(200).send(csv);
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
