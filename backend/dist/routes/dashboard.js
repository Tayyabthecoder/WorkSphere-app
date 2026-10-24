"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Project_js_1 = require("../models/Project.js");
const Task_js_1 = require("../models/Task.js");
const Sprint_js_1 = require("../models/Sprint.js");
const TimeEntry_js_1 = require("../models/TimeEntry.js");
const User_js_1 = require("../models/User.js");
const apiResponse_js_1 = require("../utils/apiResponse.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.verifyAuth);
router.use(auth_js_1.verifyTenantActive);
router.get('/summary', async (req, res) => {
    try {
        const user = req.user;
        // 1. Project counts
        const activeProjects = await Project_js_1.ProjectModel.countDocuments({
            tenantId: user.tenantId,
            status: 'Active',
        });
        // 2. Task metrics
        const deliveredTasks = await Task_js_1.TaskModel.countDocuments({
            tenantId: user.tenantId,
            status: 'Done',
        });
        const recentTasks = await Task_js_1.TaskModel.find({ tenantId: user.tenantId })
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean();
        // 3. Current active sprint
        const activeSprint = (await Sprint_js_1.SprintModel.findOne({
            tenantId: user.tenantId,
            status: 'active',
        }).lean());
        let sprintMetrics = null;
        if (activeSprint) {
            const sprintTasks = await Task_js_1.TaskModel.find({
                tenantId: user.tenantId,
                sprintId: activeSprint.sprintId,
            }).select('status storyPoints').lean();
            const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const donePoints = sprintTasks
                .filter((t) => t.status === 'Done')
                .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            const progressPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;
            sprintMetrics = {
                ...activeSprint,
                totalPoints,
                donePoints,
                progressPct,
                taskCount: sprintTasks.length,
            };
        }
        // 4. Time tracked this week
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weekTimeEntries = await TimeEntry_js_1.TimeEntryModel.find({
            tenantId: user.tenantId,
            startTime: { $gte: startOfWeek },
        }).select('duration').lean();
        const weekMinutes = weekTimeEntries.reduce((sum, te) => sum + (te.duration || 0), 0);
        const timeTrackedThisWeek = +(weekMinutes / 60).toFixed(1);
        // 5. Team count and Presence
        const teamMembers = (await User_js_1.UserModel.find({
            tenantId: user.tenantId,
            isActive: true,
        })
            .select('userId name email avatarUrl')
            .limit(6)
            .lean());
        const teamCount = await User_js_1.UserModel.countDocuments({
            tenantId: user.tenantId,
            isActive: true,
        });
        const userIds = teamMembers.map((m) => m.userId);
        const userActiveTasks = (await Task_js_1.TaskModel.find({
            tenantId: user.tenantId,
            assigneeId: { $in: userIds },
            status: { $in: ['In Progress', 'In Review', 'Todo'] },
        })
            .select('taskId title status assigneeId')
            .sort({ updatedAt: -1 })
            .lean());
        const userTaskMap = new Map();
        for (const t of userActiveTasks) {
            if (t.assigneeId && !userTaskMap.has(t.assigneeId)) {
                userTaskMap.set(t.assigneeId, t);
            }
        }
        const teamPresence = teamMembers.map((m) => {
            const task = userTaskMap.get(m.userId);
            const status = task?.status === 'In Progress'
                ? 'progress'
                : task?.status === 'In Review'
                    ? 'pending'
                    : 'completed';
            const statusLabel = task?.status || 'Online';
            return {
                name: m.name,
                avatar: m.avatarUrl,
                email: m.email,
                task: task?.title || 'No active task',
                status,
                statusLabel,
            };
        });
        // 6. Dynamic Featured Velocity Calculation
        const completedSprints = (await Sprint_js_1.SprintModel.find({
            tenantId: user.tenantId,
            status: 'completed',
        })
            .sort({ endDate: -1 })
            .limit(3)
            .lean());
        let featuredVelocity = 0;
        if (completedSprints.length > 0) {
            const sprintIds = completedSprints.map((s) => s.sprintId);
            const completedSprintTasks = await Task_js_1.TaskModel.find({
                tenantId: user.tenantId,
                sprintId: { $in: sprintIds },
                status: 'Done',
            }).select('storyPoints').lean();
            const totalDonePoints = completedSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            featuredVelocity = Math.round(totalDonePoints / completedSprints.length);
        }
        if (featuredVelocity === 0) {
            const deliveredTasksWithPoints = await Task_js_1.TaskModel.find({
                tenantId: user.tenantId,
                status: 'Done',
            }).select('storyPoints').lean();
            const points = deliveredTasksWithPoints.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
            featuredVelocity = points;
        }
        // 7. 7-Day Velocity Burnup Trend
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const velocityBurnup = [];
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dayName = daysOfWeek[d.getDay()];
            velocityBurnup.push({
                day: dayName,
                date: d.toISOString().slice(0, 10),
                completed: 0,
                remaining: sprintMetrics ? Math.max(0, sprintMetrics.totalPoints - sprintMetrics.donePoints) : 0,
            });
        }
        const recentDoneTasks = (await Task_js_1.TaskModel.find({
            tenantId: user.tenantId,
            status: 'Done',
            updatedAt: { $gte: sevenDaysAgo },
        }).select('storyPoints updatedAt').lean());
        for (const task of recentDoneTasks) {
            const taskDate = new Date(task.updatedAt).toISOString().slice(0, 10);
            const entry = velocityBurnup.find((v) => v.date === taskDate);
            if (entry) {
                entry.completed += task.storyPoints || 1;
            }
        }
        return (0, apiResponse_js_1.sendApiResponse)(res, {
            activeProjects,
            deliveredTasks,
            timeTrackedThisWeek,
            featuredVelocity,
            activeSprint: sprintMetrics,
            recentTasks,
            teamCount,
            teamPresence,
            velocityBurnup,
        });
    }
    catch (error) {
        return (0, apiResponse_js_1.sendApiError)(res, error);
    }
});
exports.default = router;
