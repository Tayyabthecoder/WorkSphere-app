import React, { useState, useEffect } from 'react';
import { Calendar, Target, Zap, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Sprint } from '../../../types';
import { useUpdateSprint } from '../../../hooks/useSprints';

interface EditSprintModalProps {
  sprint: Sprint | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditSprintModal: React.FC<EditSprintModalProps> = ({
  sprint,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const updateSprint = useUpdateSprint();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [capacityPoints, setCapacityPoints] = useState(30);
  const [status, setStatus] = useState<'planning' | 'active' | 'completed'>('planning');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sprint) {
      setName(sprint.name);
      setGoal(sprint.goal || '');
      setStartDate(sprint.startDate ? sprint.startDate.split('T')[0] : '');
      setEndDate(sprint.endDate ? sprint.endDate.split('T')[0] : '');
      setCapacityPoints(sprint.capacityPoints || 30);
      setStatus(sprint.status);
    }
  }, [sprint]);

  if (!isOpen || !sprint) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sprint name is required');
      return;
    }

    setError('');
    try {
      await updateSprint.mutateAsync({
        sprintId: sprint.sprintId,
        name: name.trim(),
        goal: goal.trim(),
        startDate,
        endDate,
        capacityPoints: Number(capacityPoints) || 30,
        status,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update sprint');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Sprint" maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
        {error && (
          <div className="p-3 rounded-lg bg-status-error-bg text-status-error-text text-xs border border-status-error-border">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-text-primary mb-1">
            Sprint Name <span className="text-status-error-text">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            rows={3}
            className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald resize-none"
          />
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-text-muted" />
              Capacity (Story Points)
            </label>
            <Input
              type="number"
              min={0}
              value={capacityPoints}
              onChange={(e) => setCapacityPoints(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-surface-card border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand-emerald"
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border mt-2">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={updateSprint.isPending}
          >
            {updateSprint.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSprintModal;
