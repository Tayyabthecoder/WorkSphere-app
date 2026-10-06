import React, { useState, useEffect } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import apiClient from '../../api/client';

interface ManualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTimeLogged: () => void;
  initialProjectId?: string;
  initialDate?: string;
}

interface ProjectOption {
  projectId: string;
  name: string;
}

interface TaskOption {
  taskId: string;
  title: string;
}

export const ManualTimeModal: React.FC<ManualTimeModalProps> = ({
  isOpen,
  onClose,
  onTimeLogged,
  initialProjectId,
  initialDate,
}) => {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [tasks, setTasks] = useState<TaskOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch projects on open
  useEffect(() => {
    if (!isOpen) return;

    apiClient
      .get('/v1/projects')
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setProjects(res.data.data);
          if (!selectedProjectId && res.data.data.length > 0) {
            setSelectedProjectId(res.data.data[0].projectId);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [isOpen]);

  // Fetch tasks when selected project changes
  useEffect(() => {
    if (!selectedProjectId) return;

    apiClient
      .get(`/v1/tasks?projectId=${selectedProjectId}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setTasks(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedTaskId(res.data.data[0].taskId);
          } else {
            setSelectedTaskId('');
          }
        }
      })
      .catch((err) => console.error(err));
  }, [selectedProjectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedTaskId) {
      setError('Please select both a project and a task');
      return;
    }

    const totalMinutes = Number(hours) * 60 + Number(minutes);
    if (totalMinutes <= 0) {
      setError('Duration must be greater than 0 minutes');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const startTime = new Date(`${date}T09:00:00`);
      await apiClient.post('/v1/time', {
        projectId: selectedProjectId,
        taskId: selectedTaskId,
        duration: totalMinutes,
        startTime: startTime.toISOString(),
        description: description.trim(),
        isBillable,
      });

      onTimeLogged();
      onClose();
      setDescription('');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to log time');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface-card border border-border/80 rounded-xl p-6 shadow-2xl w-full max-w-md flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 text-brand-emerald flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                Log Time Entry
              </h3>
              <p className="text-xs text-text-secondary">
                Record manual hours for project deliverables
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Project Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
              required
            >
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Task Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Task Deliverable *
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-surface-low border border-border/80 text-text-primary outline-none focus:ring-1 focus:ring-brand-emerald"
              required
            >
              {tasks.map((t) => (
                <option key={t.taskId} value={t.taskId}>
                  {t.title}
                </option>
              ))}
              {tasks.length === 0 && (
                <option value="" disabled>
                  No tasks available in project
                </option>
              )}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Date *
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Duration (Hours & Minutes) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Hours
              </label>
              <Input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                Minutes
              </label>
              <Input
                type="number"
                min="0"
                max="59"
                step="5"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* Billable Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-text-primary mt-1">
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
              className="w-4 h-4 rounded text-brand-emerald accent-brand-emerald cursor-pointer"
            />
            <span>Mark as Billable Time</span>
          </label>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Work Notes / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on?"
              rows={2}
              className="w-full text-xs p-3 rounded-lg bg-surface-low border border-border/80 text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-brand-emerald focus:outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || tasks.length === 0}
              className="gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              <span>Log Time</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualTimeModal;
