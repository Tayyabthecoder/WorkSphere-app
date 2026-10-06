import React, { useState } from 'react';
import { Calendar, CheckSquare, Zap, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCreateTask } from '../../../hooks/useTasks';
import { useProjects } from '../../../hooks/useProjects';

interface CreateTaskFromCalendarProps {
  initialDate?: Date | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateTaskFromCalendar: React.FC<CreateTaskFromCalendarProps> = ({
  initialDate,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();

  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [storyPoints, setStoryPoints] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (initialDate) {
      setDueDate(initialDate.toISOString().split('T')[0]);
    }
    if (projects.length > 0 && !projectId) {
      setProjectId(projects[0].projectId);
    }
  }, [initialDate, projects, projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!projectId) {
      setError('Please select a project');
      return;
    }

    setError('');
    try {
      await createTask.mutateAsync({
        projectId,
        title: title.trim(),
        priority,
        storyPoints: Number(storyPoints) || 0,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: 'To Do',
      });
      onSuccess?.();
      onClose();
      setTitle('');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create task');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task on Calendar" maxWidth="md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
        {error && (
          <div className="p-3 rounded-lg bg-status-error-bg text-status-error-text text-xs border border-status-error-border">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Project <span className="text-status-error-text">*</span>
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald"
          >
            {projects.map((p) => (
              <option key={p.projectId} value={p.projectId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Task Title <span className="text-status-error-text">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Design authentication modal"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald capitalize"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-text-muted" />
            Story Points
          </label>
          <Input
            type="number"
            min={0}
            value={storyPoints}
            onChange={(e) => setStoryPoints(Number(e.target.value))}
            placeholder="0"
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={createTask.isPending}
          >
            {createTask.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Schedule Task'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskFromCalendar;
