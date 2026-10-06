import { z } from 'zod';

const TriggerSchema = z.object({
  event: z.enum([
    'task.created',
    'task.status_changed',
    'task.priority_changed',
    'sprint.started',
    'sprint.completed',
  ]),
  condition: z
    .object({
      field: z.string().optional(),
      operator: z.enum(['equals', 'not_equals', 'contains']).optional().default('equals'),
      value: z.string().optional(),
    })
    .optional(),
});

const ActionSchema = z.object({
  type: z.enum([
    'assign_user',
    'change_priority',
    'change_status',
    'send_notification',
    'add_label',
  ]),
  params: z.record(z.any()).optional().default({}),
});

const CreateRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required').max(100),
  description: z.string().max(300).optional().default(''),
  projectId: z.string().nullable().optional(),
  trigger: TriggerSchema,
  actions: z.array(ActionSchema).min(1, 'At least one action is required'),
  isActive: z.boolean().optional().default(true),
});

describe('Automation Rule Schemas & Condition Evaluator', () => {
  describe('Rule Schema Validation', () => {
    it('should successfully parse valid rule payload', () => {
      const validPayload = {
        name: 'Auto QA on Review',
        description: 'Notify QA team when task moved to review',
        projectId: 'prj_test',
        trigger: {
          event: 'task.status_changed',
          condition: {
            field: 'status',
            operator: 'equals',
            value: 'In Review',
          },
        },
        actions: [
          { type: 'send_notification', params: { message: 'Ready for QA' } },
          { type: 'add_label', params: { label: 'needs-qa' } },
        ],
        isActive: true,
      };

      const result = CreateRuleSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject invalid trigger events', () => {
      const invalidPayload = {
        name: 'Invalid Rule',
        trigger: {
          event: 'invalid.event.name',
        },
        actions: [{ type: 'change_status', params: { status: 'Done' } }],
      };

      const result = CreateRuleSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should reject empty actions array', () => {
      const invalidPayload = {
        name: 'No Action Rule',
        trigger: { event: 'task.created' },
        actions: [],
      };

      const result = CreateRuleSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Condition Matcher Logic', () => {
    const evaluateCondition = (
      condition: { field?: string; operator?: string; value?: string },
      entity: Record<string, any>
    ): boolean => {
      if (!condition || !condition.field) return true;
      const val = entity[condition.field];
      if (condition.operator === 'equals') return String(val) === String(condition.value);
      if (condition.operator === 'not_equals') return String(val) !== String(condition.value);
      if (condition.operator === 'contains') {
        return Boolean(val && String(val).toLowerCase().includes(String(condition.value).toLowerCase()));
      }
      return false;
    };

    it('should match "equals" condition accurately', () => {
      const cond = { field: 'status', operator: 'equals', value: 'Done' };
      expect(evaluateCondition(cond, { status: 'Done' })).toBe(true);
      expect(evaluateCondition(cond, { status: 'In Progress' })).toBe(false);
    });

    it('should match "not_equals" condition accurately', () => {
      const cond = { field: 'priority', operator: 'not_equals', value: 'low' };
      expect(evaluateCondition(cond, { priority: 'critical' })).toBe(true);
      expect(evaluateCondition(cond, { priority: 'low' })).toBe(false);
    });

    it('should match "contains" condition with case-insensitivity', () => {
      const cond = { field: 'title', operator: 'contains', value: 'BUG' };
      expect(evaluateCondition(cond, { title: 'Fix critical bug in auth' })).toBe(true);
      expect(evaluateCondition(cond, { title: 'Implement feature' })).toBe(false);
    });
  });
});
