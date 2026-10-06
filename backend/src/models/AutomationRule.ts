import mongoose, { Schema, Document } from 'mongoose';

export interface IAutomationTrigger {
  event:
    | 'task.created'
    | 'task.status_changed'
    | 'task.priority_changed'
    | 'sprint.started'
    | 'sprint.completed';
  condition?: {
    field?: string;
    operator?: 'equals' | 'not_equals' | 'contains';
    value?: string;
  };
}

export interface IAutomationAction {
  type:
    | 'assign_user'
    | 'change_priority'
    | 'change_status'
    | 'send_notification'
    | 'add_label';
  params?: Record<string, any>;
}

export interface IAutomationRule extends Document {
  ruleId: string;
  tenantId: string;
  projectId?: string | null;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: IAutomationTrigger;
  actions: IAutomationAction[];
  executionCount: number;
  lastExecutedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    ruleId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, index: true, default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    trigger: {
      event: {
        type: String,
        required: true,
        enum: [
          'task.created',
          'task.status_changed',
          'task.priority_changed',
          'sprint.started',
          'sprint.completed',
        ],
      },
      condition: {
        field: { type: String },
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains'],
          default: 'equals',
        },
        value: { type: String },
      },
    },
    actions: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            'assign_user',
            'change_priority',
            'change_status',
            'send_notification',
            'add_label',
          ],
        },
        params: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    executionCount: { type: Number, default: 0 },
    lastExecutedAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

AutomationRuleSchema.index({ tenantId: 1, projectId: 1, isActive: 1 });

export const AutomationRuleModel =
  mongoose.models.AutomationRule ||
  mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);

export default AutomationRuleModel;
