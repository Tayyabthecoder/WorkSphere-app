"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchAutomationEvent = dispatchAutomationEvent;
const AutomationRule_js_1 = require("../models/AutomationRule.js");
const Task_js_1 = require("../models/Task.js");
const Notification_js_1 = require("../models/Notification.js");
const ActivityLog_js_1 = require("../models/ActivityLog.js");
const id_js_1 = require("../utils/id.js");
const index_js_1 = require("../socket/index.js");
async function dispatchAutomationEvent(options) {
    const { event, tenantId, projectId, entity, userId, depth = 0 } = options;
    if (depth > 3) {
        console.warn(`[AutomationDispatcher] Max recursion depth reached for event: ${event}`);
        return;
    }
    try {
        const ruleQuery = {
            tenantId,
            isActive: true,
            'trigger.event': event,
        };
        if (projectId) {
            ruleQuery.$or = [{ projectId }, { projectId: null }, { projectId: { $exists: false } }];
        }
        else {
            ruleQuery.$or = [{ projectId: null }, { projectId: { $exists: false } }];
        }
        const rules = await AutomationRule_js_1.AutomationRuleModel.find(ruleQuery);
        if (!rules || rules.length === 0)
            return;
        for (const rule of rules) {
            const cond = rule.trigger.condition;
            if (cond && cond.field) {
                const val = entity[cond.field];
                if (cond.operator === 'equals' && String(val) !== String(cond.value)) {
                    continue;
                }
                if (cond.operator === 'not_equals' && String(val) === String(cond.value)) {
                    continue;
                }
                if (cond.operator === 'contains' &&
                    (!val || !String(val).toLowerCase().includes(String(cond.value).toLowerCase()))) {
                    continue;
                }
            }
            let taskUpdated = false;
            const updatedFields = {};
            for (const action of rule.actions) {
                const params = action.params || {};
                switch (action.type) {
                    case 'change_status': {
                        if (entity.taskId && params.status && entity.status !== params.status) {
                            await Task_js_1.TaskModel.updateOne({ tenantId, taskId: entity.taskId }, { $set: { status: params.status } });
                            entity.status = params.status;
                            updatedFields.status = params.status;
                            taskUpdated = true;
                        }
                        break;
                    }
                    case 'change_priority': {
                        if (entity.taskId && params.priority && entity.priority !== params.priority) {
                            await Task_js_1.TaskModel.updateOne({ tenantId, taskId: entity.taskId }, { $set: { priority: params.priority } });
                            entity.priority = params.priority;
                            updatedFields.priority = params.priority;
                            taskUpdated = true;
                        }
                        break;
                    }
                    case 'assign_user': {
                        if (entity.taskId && params.userId) {
                            await Task_js_1.TaskModel.updateOne({ tenantId, taskId: entity.taskId }, { $addToSet: { assignees: params.userId } });
                            if (!entity.assignees)
                                entity.assignees = [];
                            if (!entity.assignees.includes(params.userId)) {
                                entity.assignees.push(params.userId);
                            }
                            taskUpdated = true;
                        }
                        break;
                    }
                    case 'add_label': {
                        if (entity.taskId && params.label) {
                            await Task_js_1.TaskModel.updateOne({ tenantId, taskId: entity.taskId }, { $addToSet: { labels: params.label } });
                            if (!entity.labels)
                                entity.labels = [];
                            if (!entity.labels.includes(params.label)) {
                                entity.labels.push(params.label);
                            }
                            taskUpdated = true;
                        }
                        break;
                    }
                    case 'send_notification': {
                        const message = params.message || `Automation rule "${rule.name}" triggered on ${entity.title || 'item'}.`;
                        const targetUsers = [];
                        if (params.userId)
                            targetUsers.push(params.userId);
                        if (Array.isArray(entity.assignees)) {
                            entity.assignees.forEach((u) => {
                                if (!targetUsers.includes(u))
                                    targetUsers.push(u);
                            });
                        }
                        if (userId && !targetUsers.includes(userId)) {
                            targetUsers.push(userId);
                        }
                        for (const targetUserId of targetUsers) {
                            const notification = await Notification_js_1.NotificationModel.create({
                                notificationId: (0, id_js_1.generateId)('notification'),
                                tenantId,
                                userId: targetUserId,
                                type: 'system',
                                title: `Automation: ${rule.name}`,
                                message,
                                isRead: false,
                                relatedEntityType: 'task',
                                relatedEntityId: entity.taskId,
                                entityType: 'task',
                                entityId: entity.taskId,
                            });
                            (0, index_js_1.emitToUser)(tenantId, targetUserId, 'notification:new', { notification });
                        }
                        break;
                    }
                }
            }
            if (taskUpdated && entity.projectId) {
                (0, index_js_1.emitToProject)(tenantId, entity.projectId, 'task:updated', {
                    taskId: entity.taskId,
                    ...updatedFields,
                    assignees: entity.assignees,
                    labels: entity.labels,
                });
            }
            await AutomationRule_js_1.AutomationRuleModel.updateOne({ _id: rule._id }, {
                $inc: { executionCount: 1 },
                $set: { lastExecutedAt: new Date() },
            });
            await ActivityLog_js_1.ActivityLogModel.create({
                logId: (0, id_js_1.generateId)('log'),
                tenantId,
                projectId: entity.projectId || projectId || 'general',
                userId: userId || 'system:automation',
                action: 'automation_executed',
                entityType: 'automation_rule',
                entityId: rule.ruleId,
                metadata: {
                    ruleName: rule.name,
                    triggerEvent: event,
                    targetEntityId: entity.taskId || entity.sprintId,
                },
            });
        }
    }
    catch (err) {
        console.error(`[AutomationDispatcher] Error executing rules for event ${event}:`, err);
    }
}
