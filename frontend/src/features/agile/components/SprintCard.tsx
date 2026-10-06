import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Target, Play, CheckCircle2, MoreVertical, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { Sprint } from '../../../types';
import { SprintProgressBar } from './SprintProgressBar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

interface SprintCardProps {
  sprint: Sprint;
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
  onStart: (sprintId: string) => void;
  onComplete: (sprintId: string) => void;
}

export const SprintCard: React.FC<SprintCardProps> = ({
  sprint,
  onEdit,
  onDelete,
  onStart,
  onComplete,
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const statusVariant =
    sprint.status === 'active'
      ? 'success'
      : sprint.status === 'completed'
      ? 'completed'
      : 'neutral';

  const completedPoints = sprint.completedStoryPoints || 0;
  const totalPoints = sprint.totalStoryPoints || sprint.capacityPoints || 0;
  const completedTasks = sprint.completedTasks || 0;
  const totalTasks = sprint.totalTasks || 0;

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl p-5 hover:border-brand-emerald/40 transition-all shadow-xs flex flex-col justify-between gap-4">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-text-primary text-base hover:text-brand-emerald cursor-pointer" onClick={() => navigate(`/sprints/${sprint.projectId}`)}>
                {sprint.name}
              </h3>
              <Badge variant={statusVariant} size="sm">
                {sprint.status === 'active' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                )}
                <span className="capitalize">{sprint.status}</span>
              </Badge>
            </div>
            {sprint.goal && (
              <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-0.5">
                <Target className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="line-clamp-1">{sprint.goal}</span>
              </p>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-low rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-36 bg-surface-card border border-border rounded-lg shadow-lg py-1 z-20 text-xs"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(sprint);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-text-primary hover:bg-surface-low"
                >
                  <Edit2 className="w-3.5 h-3.5 text-text-muted" />
                  Edit Sprint
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(sprint.sprintId);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-status-error-text hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date & Capacity info */}
        <div className="flex items-center gap-4 text-xs text-text-muted mt-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </span>
          </div>
          <span>•</span>
          <div>
            <span>Capacity: <strong className="text-text-primary">{sprint.capacityPoints} pts</strong></span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-1">
        <SprintProgressBar
          completedPoints={completedPoints}
          totalPoints={totalPoints}
          completedTasks={completedTasks}
          totalTasks={totalTasks}
        />
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {sprint.status === 'planning' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStart(sprint.sprintId)}
              className="text-xs h-8"
            >
              <Play className="w-3.5 h-3.5 mr-1 text-brand-emerald" />
              Start Sprint
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComplete(sprint.sprintId)}
              className="text-xs h-8 text-emerald-600 border-emerald-600/30 hover:bg-emerald-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Complete Sprint
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/sprints/${sprint.projectId}`)}
          className="text-xs h-8 text-brand-emerald hover:text-brand-emerald hover:bg-brand-emerald/10 ml-auto"
        >
          Board View
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default SprintCard;
