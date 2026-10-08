import React, { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Zap, Clock, User, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCreateTask } from '../../../hooks/useTasks';
import { useProjects } from '../../../hooks/useProjects';
import { useTeam } from '../../../hooks/useTeam';
import { useSprints } from '../../../hooks/useSprints';
import { useToast } from '../../../components/ui/ToastContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  onSuccess?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: team = [] } = useTeam();
  const createTask = useCreateTask();

  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Backlog' | 'To Do' | 'In Progress' | 'In Review' | 'Done'>('To Do');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [storyPoints, setStoryPoints] = useState<number | ''>('');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [error, setError] = useState('');

  // Sprints for the selected project
  const { data: sprints = [] } = useSprints(projectId || undefined);

  // Sync selected project with defaultProjectId or first available project
  useEffect(() => {
    if (defaultProjectId && projects.some((p) => p.projectId === defaultProjectId)) {
      setProjectId(defaultProjectId);
    } else if (!projectId && projects.length > 0) {
      setProjectId(projects[0].projectId);
    }
  }, [defaultProjectId, projects, projectId]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (defaultProjectId && projects.some((p) => p.projectId === defaultProjectId)) {
        setProjectId(defaultProjectId);
      } else if (!projectId && projects.length > 0) {
        setProjectId(projects[0].projectId);
      }
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('To Do');
    setPriority('medium');
    setAssigneeId('');
    setSprintId('');
    setDueDate('');
    setStoryPoints('');
    setEstimatedHours('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      setError('Please select a project');
      return;
    }

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setError('');

    try {
      await createTask.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assignees: assigneeId ? [assigneeId] : [],
        sprintId: sprintId || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        storyPoints: storyPoints === '' ? 0 : Number(storyPoints),
        estimatedHours: estimatedHours === '' ? 0 : Number(estimatedHours),
      });

      toast.success('Task created successfully', {
        message: `Deliverable "${title.trim()}" has been scheduled.`,
      });

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to create task';
      setError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Task"
      description="Add a new deliverable to your project workflow"
      icon={<CheckSquare className="w-4 h-4 text-brand-emerald" />}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-xs pt-1">
        {error && (
          <div className="p-3 rounded-lg bg-status-error-bg text-status-error-text text-xs border border-status-error-border flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Project Selector */}
        <div>
          <label className="block font-semibold text-text-primary mb-1">
            Project <span className="text-status-error-text">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setSprintId(''); // Reset sprint when project changes
            }}
            disabled={isLoadingProjects || projects.length === 0}
            className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
            required
          >
            {projects.length === 0 ? (
              <option value="">No projects available</option>
            ) : (
              projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name} {p.key ? `(${p.key})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block font-semibold text-text-primary mb-1">
            Task Title <span className="text-status-error-text">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement OAuth2 authentication flow"
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold text-text-primary mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, acceptance criteria, or technical notes..."
            className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald resize-none"
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald capitalize"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Initial Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="Backlog">Backlog</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review</option>
              <option value="Done">Done</option>
            </select>
          </div>
        </div>

        {/* Assignee & Sprint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-text-muted" />
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="">Unassigned</option>
              {team
                .filter((member) => member.isActive !== false)
                .map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.name} ({member.email})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1">
              Sprint (Optional)
            </label>
            <select
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="">None (Backlog / Ad-hoc)</option>
              {sprints.map((s) => (
                <option key={s.sprintId} value={s.sprintId}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates & Effort Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-text-muted" />
              Story Points
            </label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={storyPoints}
              onChange={(e) => setStoryPoints(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              Est. Hours
            </label>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
          <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={createTask.isPending || projects.length === 0}
            leftIcon={
              createTask.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckSquare className="w-3.5 h-3.5" />
              )
            }
          >
            {createTask.isPending ? 'Creating Task...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
