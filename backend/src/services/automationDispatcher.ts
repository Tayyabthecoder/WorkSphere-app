import { AutomationRuleModel } from '../models/AutomationRule.js';
import { TaskModel } from '../models/Task.js';
import { NotificationModel } from '../models/Notification.js';
import { ActivityLogModel } from '../models/ActivityLog.js';
import { generateId } from '../utils/id.js';
import { emitToProject, emitToUser } from '../socket/index.js';

export interface DispatchEventOptions {
  event:
    | 'task.created'
    | 'task.status_changed'
    | 'task.priority_changed'
    | 'sprint.started'
    | 'sprint.completed';
  tenantId: string;
  projectId?: string;
  entity: Record<string, any>;
  userId?: string;
  depth?: number;
}

export async function dispatchAutomationEvent(options: DispatchEventOptions): Promise<void> {
  const { event, tenantId, projectId, entity, userId, depth = 0 } = options;

  if (depth > 3) {
    console.warn(`[AutomationDispatcher] Max recursion depth reached for event: ${event}`);
    return;
  }

  try {
    const ruleQuery: any = {
      tenantId,
      isActive: true,
      'trigger.event': event,
    };

    if (projectId) {
      ruleQuery.$or = [{ projectId }, { projectId: null }, { projectId: { $exists: false } }];
    } else {
      ruleQuery.$or = [{ projectId: null }, { projectId: { $exists: false } }];
    }

    const rules = await AutomationRuleModel.find(ruleQuery);
    if (!rules || rules.length === 0) return;

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
        if (
          cond.operator === 'contains' &&
          (!val || !String(val).toLowerCase().includes(String(cond.value).toLowerCase()))
        ) {
          continue;
        }
      }

      let taskUpdated = false;
      const updatedFields: Record<string, any> = {};

      for (const action of rule.actions) {
        const params = action.params || {};

        switch (action.type) {
          case 'change_status': {
            if (entity.taskId && params.status && entity.status !== params.status) {
              await TaskModel.updateOne(
                { tenantId, taskId: entity.taskId },
                { $set: { status: params.status } }
              );
              entity.status = params.status;
              updatedFields.status = params.status;
              taskUpdated = true;
            }
            break;
          }

          case 'change_priority': {
            if (entity.taskId && params.priority && entity.priority !== params.priority) {
              await TaskModel.updateOne(
                { tenantId, taskId: entity.taskId },
                { $set: { priority: params.priority } }
              );
              entity.priority = params.priority;
              updatedFields.priority = params.priority;
              taskUpdated = true;
            }
            break;
          }

          case 'assign_user': {
            if (entity.taskId && params.userId) {
              await TaskModel.updateOne(
                { tenantId, taskId: entity.taskId },
                { $addToSet: { assignees: params.userId } }
              );
              if (!entity.assignees) entity.assignees = [];
              if (!entity.assignees.includes(params.userId)) {
                entity.assignees.push(params.userId);
              }
              taskUpdated = true;
            }
            break;
          }

          case 'add_label': {
            if (entity.taskId && params.label) {
              await TaskModel.updateOne(
                { tenantId, taskId: entity.taskId },
                { $addToSet: { labels: params.label } }
              );
              if (!entity.labels) entity.labels = [];
              if (!entity.labels.includes(params.label)) {
                entity.labels.push(params.label);
              }
              taskUpdated = true;
            }
            break;
          }

          case 'send_notification': {
            const message =
              params.message || `Automation rule "${rule.name}" triggered on ${entity.title || 'item'}.`;
            const targetUsers: string[] = [];
            if (params.userId) targetUsers.push(params.userId);
            if (Array.isArray(entity.assignees)) {
              entity.assignees.forEach((u: string) => {
                if (!targetUsers.includes(u)) targetUsers.push(u);
              });
            }
            if (userId && !targetUsers.includes(userId)) {
              targetUsers.push(userId);
            }

            for (const targetUserId of targetUsers) {
              const notification = await NotificationModel.create({
                notificationId: generateId('notification'),
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

              emitToUser(tenantId, targetUserId, 'notification:new', { notification });
            }
            break;
          }
        }
      }

      if (taskUpdated && entity.projectId) {
        emitToProject(tenantId, entity.projectId, 'task:updated', {
          taskId: entity.taskId,
          ...updatedFields,
          assignees: entity.assignees,
          labels: entity.labels,
        });
      }

      await AutomationRuleModel.updateOne(
        { _id: rule._id },
        {
          $inc: { executionCount: 1 },
          $set: { lastExecutedAt: new Date() },
        }
      );

      await ActivityLogModel.create({
        logId: generateId('log'),
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
  } catch (err) {
    console.error(`[AutomationDispatcher] Error executing rules for event ${event}:`, err);
  }
}
