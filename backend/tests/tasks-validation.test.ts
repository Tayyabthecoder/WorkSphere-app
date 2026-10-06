import { generateId, IdPrefix } from '../src/utils/id.js';
import { z } from 'zod';

const UpdateTaskSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().optional(),
  status: z.enum(['Backlog', 'To Do', 'In Progress', 'In Review', 'Done']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  storyPoints: z.number().min(0).optional(),
  estimatedHours: z.number().min(0).optional(),
  sprintId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
  customFields: z.record(z.unknown()).optional(),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  status: z.enum(['Active', 'On Hold', 'Completed', 'Archived']).optional(),
  methodology: z.enum(['Agile', 'Waterfall', 'Hybrid']).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  colorLabel: z.string().optional(),
  budgetTotal: z.number().min(0).optional(),
  currency: z.string().optional(),
  clientId: z.string().nullable().optional(),
});

describe('ID Generation & Task Validation Schema', () => {
  describe('generateId()', () => {
    it('should generate formatted unique IDs with expected entity prefixes', () => {
      const taskId = generateId('task');
      expect(taskId).toMatch(/^tsk_[a-f0-9]{16}$/);

      const commentId = generateId('comment');
      expect(commentId).toMatch(/^cmt_[a-f0-9]{16}$/);

      const activityId = generateId('act');
      expect(activityId).toMatch(/^act_[a-f0-9]{16}$/);

      const projectId = generateId('project');
      expect(projectId).toMatch(/^prj_[a-f0-9]{16}$/);
    });

    it('should generate non-colliding unique IDs across sequential calls', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 50; i++) {
        ids.add(generateId('task'));
      }
      expect(ids.size).toBe(50);
    });
  });

  describe('UpdateTaskSchema Sanitization', () => {
    it('should parse valid task update payload', () => {
      const payload = {
        title: 'Refactor Navigation Component',
        status: 'In Progress',
        priority: 'high',
        storyPoints: 5,
      };

      const result = UpdateTaskSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Refactor Navigation Component');
        expect(result.data.status).toBe('In Progress');
      }
    });

    it('should reject invalid task status', () => {
      const payload = {
        status: 'UnknownStatus',
      };

      const result = UpdateTaskSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should strip injected disallowed fields such as tenantId or taskId', () => {
      const payload = {
        title: 'Legitimate Title',
        tenantId: 'hacked-tenant',
        taskId: 'tsk_injected',
      };

      const result = UpdateTaskSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).tenantId).toBeUndefined();
        expect((result.data as any).taskId).toBeUndefined();
      }
    });
  });

  describe('UpdateProjectSchema Sanitization', () => {
    it('should parse valid project update payload', () => {
      const payload = {
        name: 'AI Operations Platform',
        status: 'Active',
        methodology: 'Agile',
        budgetTotal: 50000,
        currency: 'USD',
      };

      const result = UpdateProjectSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('AI Operations Platform');
        expect(result.data.methodology).toBe('Agile');
      }
    });

    it('should reject invalid project methodology', () => {
      const payload = {
        methodology: 'InvalidMethodology',
      };

      const result = UpdateProjectSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should disallow and strip injected tenantId or projectId fields', () => {
      const payload = {
        name: 'Platform Core',
        tenantId: 'rogue_tenant',
        projectId: 'prj_injected',
      };

      const result = UpdateProjectSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as any).tenantId).toBeUndefined();
        expect((result.data as any).projectId).toBeUndefined();
      }
    });
  });
});
