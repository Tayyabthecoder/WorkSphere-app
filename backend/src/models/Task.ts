import mongoose, { Schema, Document } from 'mongoose';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';

export interface ITaskDependency {
  taskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

export interface ITaskData {
  taskId: string;
  tenantId: string;
  projectId: string;
  parentTaskId?: string | null;
  sprintId?: string | null;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees?: string[]; // array of userIds
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  storyPoints?: number;
  customFields?: Record<string, unknown>;
  dependencies?: ITaskDependency[];
  labels?: string[];
  order?: number;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITask extends Document, ITaskData {}

const TaskSchema = new Schema<ITask>(
  {
    taskId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    parentTaskId: { type: String, default: null, index: true },
    sprintId: { type: String, default: null, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      default: 'To Do',
      index: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      default: 'medium',
      index: true,
    },
    assignees: [{ type: String, index: true }],
    dueDate: { type: Date, index: true },
    startDate: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    storyPoints: { type: Number, default: 0 },
    customFields: { type: Schema.Types.Mixed, default: {} },
    dependencies: [
      {
        taskId: { type: String, required: true },
        type: {
          type: String,
          enum: ['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish'],
          default: 'finish-to-start',
        },
      },
    ],
    labels: [{ type: String }],
    order: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant queries
TaskSchema.index({ tenantId: 1, projectId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, assignees: 1, dueDate: 1 });
TaskSchema.index({ tenantId: 1, sprintId: 1 });
TaskSchema.index({ tenantId: 1, sprintId: 1, status: 1 });
TaskSchema.index({ tenantId: 1, taskId: 1 }, { unique: true });

export const TaskModel = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default TaskModel;
