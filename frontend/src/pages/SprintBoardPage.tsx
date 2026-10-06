import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Zap, TrendingDown, Plus, CheckSquare, Loader2, Layers, Kanban } from 'lucide-react';
import { useProject } from '../hooks/useProjects';
import { useSprints } from '../hooks/useSprints';
import { useTasks, useUpdateTask, useCreateTask } from '../hooks/useTasks';
import { BacklogView } from '../features/agile/components/BacklogView';
import { BacklogPanel } from '../features/agile/components/BacklogPanel';
import { SprintBurndownChart } from '../features/agile/components/SprintBurndownChart';
import { SprintTaskRow } from '../features/agile/components/SprintTaskRow';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Task } from '../types';

export const SprintBoardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: project, isLoading: isLoadingProject } = useProject(projectId);
  const { data: sprints = [], isLoading: isLoadingSprints } = useSprints(projectId);
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks({ projectId });

  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  const [viewMode, setViewMode] = useState<'backlog' | 'board'>(
    location.pathname.includes('/backlog') ? 'backlog' : 'board'
  );
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [showBurndown, setShowBurndown] = useState(false);

  // Default to active sprint, or first available sprint
  React.useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      const active = sprints.find((s) => s.status === 'active');
      setSelectedSprintId(active ? active.sprintId : sprints[0].sprintId);
    }
  }, [sprints, selectedSprintId]);

  const currentSprint = sprints.find((s) => s.sprintId === selectedSprintId);
  const sprintTasks = tasks.filter((t) => t.sprintId === selectedSprintId);

  const handleMoveToSprint = async (taskId: string, sprintId: string) => {
    await updateTask.mutateAsync({ taskId, sprintId });
  };

  const handleMoveToBacklog = async (taskId: string) => {
    await updateTask.mutateAsync({ taskId, sprintId: null });
  };

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    await updateTask.mutateAsync({ taskId, status });
  };

  const handleCreateBacklogTask = async (title: string, storyPoints?: number) => {
    if (!projectId) return;
    await createTask.mutateAsync({
      projectId,
      title,
      storyPoints: storyPoints || 0,
      status: 'Backlog',
      priority: 'medium',
      sprintId: null,
    });
  };

  if (isLoadingProject || isLoadingSprints || isLoadingTasks) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <span className="text-xs text-text-muted">Loading sprint workspace...</span>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="p-8 text-center text-text-muted">
        No project specified.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/sprints')}
            className="text-xs h-8 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            All Sprints
          </Button>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-lg font-bold text-text-primary">
              {project?.name || 'Project'} • {viewMode === 'backlog' ? 'Backlog Planning' : 'Sprint Board'}
            </h1>
            <p className="text-xs text-text-muted">
              {viewMode === 'backlog'
                ? 'Multi-sprint velocity tracking and story estimation workspace'
                : 'Drag, assign, and organize tasks between backlog and sprint cycles'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-surface-card">
            <button
              onClick={() => setViewMode('backlog')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'backlog'
                  ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Backlog View</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                viewMode === 'board'
                  ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Sprint Board</span>
            </button>
          </div>

          {viewMode === 'board' && (
            <>
              {sprints.length > 0 && (
                <select
                  value={selectedSprintId}
                  onChange={(e) => setSelectedSprintId(e.target.value)}
                  className="px-3 py-1.5 bg-surface-card border border-border rounded-lg text-xs font-medium text-text-primary focus:outline-none"
                >
                  {sprints.map((s) => (
                    <option key={s.sprintId} value={s.sprintId}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              )}

              {currentSprint && (
                <Button
                  variant={showBurndown ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowBurndown(!showBurndown)}
                  className="text-xs h-8"
                >
                  <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                  {showBurndown ? 'Hide Burndown' : 'View Burndown'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main View Body */}
      {viewMode === 'backlog' ? (
        <BacklogView projectId={projectId} projectName={project?.name} />
      ) : (
        <>
          {/* Burndown Chart collapsible */}
          {showBurndown && currentSprint && (
            <SprintBurndownChart sprint={currentSprint} tasks={tasks} />
          )}

          {/* Two-Panel Split: Backlog on Left, Sprint Board on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
            {/* Left: Backlog Panel (4 cols) */}
            <div className="lg:col-span-4 h-full">
              <BacklogPanel
                tasks={tasks}
                activeSprintId={selectedSprintId}
                onAddToSprint={handleMoveToSprint}
                onCreateBacklogTask={handleCreateBacklogTask}
              />
            </div>

            {/* Right: Active Sprint Scope (8 cols) */}
            <div className="lg:col-span-8 flex flex-col h-full bg-surface-card border border-border rounded-xl p-5 shadow-xs">
              {currentSprint ? (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-text-primary text-base">
                        {currentSprint.name}
                      </h3>
                      <Badge variant={currentSprint.status === 'active' ? 'success' : 'neutral'} size="sm">
                        {currentSprint.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-muted">
                      {sprintTasks.length} {sprintTasks.length === 1 ? 'task' : 'tasks'} assigned
                    </div>
                  </div>

                  {/* Tasks in sprint */}
                  <div className="flex-1 overflow-y-auto mt-4 flex flex-col gap-2.5">
                    {sprintTasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-text-muted text-center border border-dashed border-border rounded-lg">
                        <CheckSquare className="w-8 h-8 stroke-[1.5] mb-2 opacity-40" />
                        <p className="text-xs">No tasks in this sprint yet.</p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Use the "To Sprint" button on backlog items to add them here.
                        </p>
                      </div>
                    ) : (
                      sprintTasks.map((task) => (
                        <SprintTaskRow
                          key={task.taskId}
                          task={task}
                          onMoveToBacklog={handleMoveToBacklog}
                          onStatusChange={handleStatusChange}
                        />
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                  <Zap className="w-10 h-10 opacity-30 mb-2" />
                  <p className="text-sm font-semibold">No sprint selected</p>
                  <p className="text-xs mt-1">Please select or create a sprint to view sprint tasks.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SprintBoardPage;
