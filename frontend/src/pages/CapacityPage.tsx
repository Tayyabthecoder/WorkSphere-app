import React, { useState } from 'react';
import {
  Activity,
  Users,
  Zap,
  CheckCircle2,
  Loader2,
  Columns,
  Grid,
  Calendar,
  Layers,
} from 'lucide-react';
import { useTeam } from '../hooks/useTeam';
import { useTasks } from '../hooks/useTasks';
import { useSprints } from '../hooks/useSprints';
import { CapacityGrid } from '../features/capacity/components/CapacityGrid';
import { WorkloadSwimlaneView } from '../features/capacity/components/WorkloadSwimlaneView';
import { SprintAllocationView } from '../features/capacity/components/SprintAllocationView';
import { AvailabilityCalendar } from '../features/capacity/components/AvailabilityCalendar';

type ViewMode = 'swimlanes' | 'grid' | 'sprint' | 'availability';

export const CapacityPage: React.FC = () => {
  const { data: team = [], isLoading: isLoadingTeam } = useTeam();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();
  const { data: sprints = [], isLoading: isLoadingSprints } = useSprints('all');

  const [viewMode, setViewMode] = useState<ViewMode>('swimlanes');

  const activeTasks = tasks.filter((t) => t.status !== 'Done').length;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Capacity & Resource Planning</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald rounded-full">
              Workload Suite
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Analyze resource bandwidth, prevent team burnout, and balance sprint commitments.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-surface-card self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setViewMode('swimlanes')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'swimlanes'
                ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Workload Swimlanes</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'grid'
                ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Weekly Grid</span>
          </button>
          <button
            onClick={() => setViewMode('sprint')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'sprint'
                ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sprint Allocations</span>
          </button>
          <button
            onClick={() => setViewMode('availability')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              viewMode === 'availability'
                ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>PTO & Availability</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">{team.length}</div>
            <div className="text-xs text-text-muted">Total Available Members</div>
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">{activeTasks}</div>
            <div className="text-xs text-text-muted">Active Assigned Tasks</div>
          </div>
        </div>

        <div className="bg-surface-card border border-border rounded-xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-text-primary">{sprints.length}</div>
            <div className="text-xs text-text-muted">Planned Sprints</div>
          </div>
        </div>
      </div>

      {/* Main Content View Switcher */}
      {isLoadingTeam || isLoadingTasks ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
          <span className="text-xs">Calculating capacity data...</span>
        </div>
      ) : viewMode === 'swimlanes' ? (
        <WorkloadSwimlaneView />
      ) : viewMode === 'grid' ? (
        <CapacityGrid members={team} tasks={tasks} />
      ) : viewMode === 'sprint' ? (
        <SprintAllocationView sprints={sprints} members={team} tasks={tasks} />
      ) : (
        <AvailabilityCalendar />
      )}
    </div>
  );
};

export default CapacityPage;
