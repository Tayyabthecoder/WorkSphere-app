import React, { useState } from 'react';
import { Calendar, Target, Zap, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useCreateSprint } from '../../../hooks/useSprints';
import { useProjects } from '../../../hooks/useProjects';

interface CreateSprintModalProps {
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateSprintModal: React.FC<CreateSprintModalProps> = ({
  projectId: initialProjectId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: projects = [] } = useProjects();
  const createSprint = useCreateSprint();

  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || '');
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [capacityPoints, setCapacityPoints] = useState(30);
  const [error, setError] = useState('');

  // Keep selectedProjectId in sync when initialProjectId changes
  React.useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId);
    } else if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].projectId);
    }
  }, [initialProjectId, projects, selectedProjectId]);

  const handleDurationClick = (weeks: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + weeks * 7);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sprint name is required');
      return;
    }
    const pid = initialProjectId || selectedProjectId;
    if (!pid) {
      setError('Please select a project');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date');
      return;
    }

    setError('');
    try {
      await createSprint.mutateAsync({
        projectId: pid,
        name: name.trim(),
        goal: goal.trim(),
        startDate,
        endDate,
        capacityPoints: Number(capacityPoints) || 30,
      });
      onSuccess?.();
      onClose();
      // Reset form
      setName('');
      setGoal('');
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to create sprint');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Sprint" maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
        {error && (
          <div className="p-3 rounded-lg bg-status-error-bg text-status-error-text text-xs border border-status-error-border">
            {error}
          </div>
        )}

        {!initialProjectId && (
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Project <span className="text-status-error-text">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="" disabled>Select a project</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Sprint Name <span className="text-status-error-text">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sprint 14 - Checkout Flow"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-text-muted" />
            Sprint Goal
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What is the key objective or deliverable for this sprint?"
            rows={3}
            className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald resize-none"
          />
        </div>

        {/* Date Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Fast duration buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Duration:</span>
          {[1, 2, 3, 4].map((weeks) => (
            <button
              key={weeks}
              type="button"
              onClick={() => handleDurationClick(weeks)}
              className="px-2.5 py-1 text-xs rounded-md bg-surface-low hover:bg-surface-card border border-border text-text-secondary transition-colors"
            >
              {weeks} {weeks === 1 ? 'week' : 'weeks'}
            </button>
          ))}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-text-muted" />
            Target Capacity (Story Points)
          </label>
          <Input
            type="number"
            min={0}
            value={capacityPoints}
            onChange={(e) => setCapacityPoints(Number(e.target.value))}
            placeholder="30"
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
            disabled={createSprint.isPending}
          >
            {createSprint.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Sprint'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateSprintModal;
