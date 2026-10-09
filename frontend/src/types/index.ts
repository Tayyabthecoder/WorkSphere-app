export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface Project {
  projectId: string;
  tenantId: string;
  name: string;
  key?: string;
  description?: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';
  budget?: {
    total: number;
    currency: string;
    spent?: number;
  };
  startDate?: string;
  endDate?: string;
  members?: string[];
  clientId?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  taskId: string;
  tenantId: string;
  projectId: string;
  parentTaskId?: string | null;
  sprintId?: string | null;
  title: string;
  description?: string;
  status: 'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignees?: string[];
  assigneeProfiles?: {
    userId: string;
    name: string;
    email?: string;
    avatarUrl?: string;
  }[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  storyPoints?: number;
  dependencies?: { taskId: string; type: string }[];
  labels?: string[];
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Sprint {
  sprintId: string;
  tenantId: string;
  projectId: string;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed';
  startDate: string;
  endDate: string;
  capacityPoints: number;
  committedPoints?: number;
  totalTasks?: number;
  completedTasks?: number;
  totalStoryPoints?: number;
  completedStoryPoints?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  role: 'superAdmin' | 'orgAdmin' | 'managingDirector' | 'hr' | 'manager' | 'teamLeader' | 'member' | 'viewer';
  avatarUrl?: string;
  department?: string;
  teamId?: string | null;
  reportsToUserId?: string | null;
  jobTitle?: string;
  team?: {
    teamId: string;
    name: string;
    department?: string;
    colorLabel?: string;
  } | null;
  reportsToUser?: {
    userId: string;
    name: string;
    role: string;
    jobTitle?: string;
  } | null;
  isActive: boolean;
  activeTasks?: number;
  completedTasks?: number;
  title?: string;
  phone?: string;
  createdAt?: string;
}

export interface Team {
  teamId: string;
  tenantId: string;
  name: string;
  description?: string;
  department: string;
  managerId: string;
  leaderId?: string | null;
  manager?: {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    jobTitle?: string;
  };
  leader?: {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
    jobTitle?: string;
  };
  memberIds: string[];
  members?: TeamMember[];
  colorLabel?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invitation {
  invitationId: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'superAdmin' | 'orgAdmin' | 'managingDirector' | 'hr' | 'manager' | 'teamLeader' | 'member' | 'viewer';
  department?: string;
  teamId?: string | null;
  invitedByUserId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPortalSettings {
  allowOverview: boolean;
  allowTimeline: boolean;
  allowDeliverables: boolean;
  allowFinancialSummary: boolean;
}

export interface Client {
  clientId: string;
  tenantId: string;
  name: string;
  company: string;
  primaryEmail: string;
  companyLogoUrl?: string;
  portalToken: string;
  isPortalActive: boolean;
  portalSettings?: ClientPortalSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface Announcement {
  announcementId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  targetAudience: 'all' | 'specific';
  targetTenantIds?: string[];
  isActive: boolean;
  scheduledAt?: string;
  expiresAt?: string;
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  notificationId: string;
  tenantId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface TimeEntry {
  entryId: string;
  tenantId: string;
  userId: string;
  projectId: string;
  taskId?: string;
  date: string;
  hours: number;
  description?: string;
  isBillable: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  rejectionNote?: string;
  submittedAt?: string;
  approvedAt?: string;
  reviewedBy?: string;
  createdAt?: string;
}

export interface DocumentItem {
  documentId: string;
  tenantId?: string;
  projectId: string;
  projectName?: string;
  folderId?: string | null;
  title: string;
  content: string;
  versionCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface FolderItem {
  folderId: string;
  tenantId?: string;
  projectId: string;
  name: string;
  parentFolderId?: string | null;
  createdAt: string;
}

export interface FileItem {
  fileId: string;
  tenantId?: string;
  projectId: string;
  projectName?: string;
  folderId?: string | null;
  name: string;
  mimeType: string;
  size: number;
  storageUrl?: string;
  createdAt: string;
}

export interface IRetentionPolicy {
  activityLogRetentionDays: number;
  completedTasksRetentionDays: number;
  inactiveProjectArchiveDays: number;
  purgedRecordsWindowDays: number;
  autoArchiveEnabled: boolean;
  autoPurgeEnabled: boolean;
  lastRunAt?: string;
}

export interface ISecurityPolicy {
  mfaRequired: boolean;
  sessionTimeoutMinutes: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
  ipAllowlist: string[];
  ipBlocklist: string[];
  ssoEnabled: boolean;
}

export interface TaskComment {
  commentId: string;
  tenantId: string;
  taskId: string;
  projectId: string;
  authorId: string;
  authorName?: string;
  authorAvatarUrl?: string;
  content: string;
  mentions?: string[];
  isDeleted: boolean;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationTrigger {
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

export interface AutomationAction {
  type:
    | 'assign_user'
    | 'change_priority'
    | 'change_status'
    | 'send_notification'
    | 'add_label';
  params?: Record<string, any>;
}

export interface AutomationRule {
  ruleId: string;
  tenantId: string;
  projectId?: string | null;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  executionCount: number;
  lastExecutedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


