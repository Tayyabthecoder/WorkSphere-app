import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GanttChart as GanttIcon, Loader2 } from 'lucide-react';
import { useProjects } from '../../../hooks/useProjects';
import { useTasks } from '../../../hooks/useTasks';
import { useSprints } from '../../../hooks/useSprints';
import { GanttToolbar } from './GanttToolbar';
import { GanttTaskRow } from './GanttTaskRow';
import { GanttMilestoneMarker } from './GanttMilestoneMarker';
import { Task, Sprint } from '../../../types';
import { calculateCPM } from '../utils/cpm';

interface GanttChartProps {
  projectId?: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({ projectId }) => {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [zoomMode, setZoomMode] = useState<'day' | 'week' | 'month'>('day');
  const [showCriticalPath, setShowCriticalPath] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState<number>(800);

  const effectiveProjectId = projectId || selectedProjectId;

  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(
    effectiveProjectId === 'all' ? undefined : { projectId: effectiveProjectId }
  );

  const { data: sprints = [] } = useSprints(
    effectiveProjectId === 'all' ? 'all' : effectiveProjectId
  );

  // ResizeObserver to track responsive pixel width for SVG curves
  useEffect(() => {
    if (!timelineRef.current) return;
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    const observer = new ResizeObserver(updateWidth);
    observer.observe(timelineRef.current);
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
    };
  }, [tasks.length]);

  // True Critical Path Method (CPM) calculation
  const cpmResult = useMemo(() => calculateCPM(tasks), [tasks]);

  // Compute timeline boundaries
  const { startDate, endDate, totalDays, timeColumns } = useMemo(() => {
    let minDate = Date.now();
    let maxDate = Date.now() + 86400000 * 14;

    tasks.forEach((t) => {
      const s = t.startDate
        ? new Date(t.startDate).getTime()
        : t.dueDate
        ? new Date(t.dueDate).getTime() - 86400000 * 3
        : Date.now();
      const e = t.dueDate ? new Date(t.dueDate).getTime() : s + 86400000 * 3;
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    });

    sprints.forEach((s) => {
      const start = new Date(s.startDate).getTime();
      const end = new Date(s.endDate).getTime();
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    });

    const start = new Date(minDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(maxDate);
    end.setHours(23, 59, 59, 999);

    const diff = Math.max(7, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const cols = [];
    for (let i = 0; i < diff; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      cols.push(d);
    }

    return {
      startDate: start,
      endDate: end,
      totalDays: diff,
      timeColumns: cols,
    };
  }, [tasks, sprints]);

  // Compute bar positions
  const getTaskBarCoords = (task: Task) => {
    const s = task.startDate
      ? new Date(task.startDate).getTime()
      : task.dueDate
      ? new Date(task.dueDate).getTime() - 86400000 * 2
      : Date.now();
    const e = task.dueDate ? new Date(task.dueDate).getTime() : s + 86400000 * 3;

    const leftMs = Math.max(0, s - startDate.getTime());
    const widthMs = Math.max(86400000, e - s);
    const totalMs = totalDays * 86400000;

    const leftPercent = Math.min(100, Math.max(0, (leftMs / totalMs) * 100));
    const widthPercent = Math.min(100 - leftPercent, Math.max(2, (widthMs / totalMs) * 100));

    return { leftPercent, widthPercent };
  };

  const getSprintMilestonePercent = (sprint: Sprint) => {
    const endMs = new Date(sprint.endDate).getTime() - startDate.getTime();
    const totalMs = totalDays * 86400000;
    return Math.min(100, Math.max(0, (endMs / totalMs) * 100));
  };

  // Compute SVG dependency connectors between predecessor and successor task bars
  const dependencyEdges = useMemo(() => {
    const edges: {
      id: string;
      pathD: string;
      isCritical: boolean;
    }[] = [];

    const taskIndexMap = new Map<string, number>();
    tasks.forEach((t, i) => taskIndexMap.set(t.taskId, i));

    tasks.forEach((targetTask, targetIndex) => {
      if (!Array.isArray(targetTask.dependencies) || targetTask.dependencies.length === 0) return;

      const targetCoords = getTaskBarCoords(targetTask);
      const targetX = (targetCoords.leftPercent / 100) * timelineWidth;
      const targetY = targetIndex * 40 + 20;

      targetTask.dependencies.forEach((dep) => {
        const predId = typeof dep === 'string' ? dep : dep.taskId;
        const predIndex = taskIndexMap.get(predId);
        if (predIndex === undefined) return;

        const predTask = tasks[predIndex];
        const predCoords = getTaskBarCoords(predTask);
        const startX = ((predCoords.leftPercent + predCoords.widthPercent) / 100) * timelineWidth;
        const startY = predIndex * 40 + 20;

        const isCritical =
          showCriticalPath &&
          cpmResult.criticalTaskIds.has(predId) &&
          cpmResult.criticalTaskIds.has(targetTask.taskId);

        const dx = targetX - startX;
        let pathD = '';

        if (dx >= 15) {
          const controlX = startX + Math.min(40, dx / 2);
          pathD = `M ${startX} ${startY} C ${controlX} ${startY}, ${targetX - 25} ${targetY}, ${targetX} ${targetY}`;
        } else {
          const midY = (startY + targetY) / 2;
          pathD = `M ${startX} ${startY} L ${startX + 12} ${startY} L ${startX + 12} ${midY} L ${targetX - 16} ${midY} L ${targetX - 16} ${targetY} L ${targetX} ${targetY}`;
        }

        edges.push({
          id: `${predId}->${targetTask.taskId}`,
          pathD,
          isCritical,
        });
      });
    });

    return edges;
  }, [tasks, timelineWidth, showCriticalPath, cpmResult, startDate, totalDays]);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Gantt Chart & Dependencies</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald rounded-full">
              WBS & Critical Path
            </span>
            {showCriticalPath && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-full animate-pulse">
                Critical Path: {cpmResult.criticalTaskIds.size} Tasks
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Visual work breakdown structure, task durations, and agile sprint milestones.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <GanttToolbar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onChangeProject={setSelectedProjectId}
        zoomMode={zoomMode}
        onChangeZoomMode={setZoomMode}
        showCriticalPath={showCriticalPath}
        onToggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}
      />

      {/* Gantt Main Grid */}
      {isLoadingTasks || isLoadingProjects ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
          <span className="text-xs">Loading Gantt schedule...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-dashed border-border rounded-xl text-center">
          <GanttIcon className="w-12 h-12 text-brand-emerald/40 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No tasks to schedule</h3>
          <p className="text-xs text-text-muted max-w-sm mt-1 mb-4">
            Add tasks with due dates to visualize their execution sequence and milestones on the Gantt chart.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="flex divide-x divide-border overflow-x-auto">
            {/* Left Column: Task Info Table (w-72) */}
            <div className="w-72 shrink-0 flex flex-col border-r border-border">
              <div className="h-10 px-3 bg-surface-low border-b border-border flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span>Task Name</span>
                <span>Status</span>
              </div>
              <div className="flex flex-col">
                {tasks.map((task) => (
                  <GanttTaskRow
                    key={task.taskId}
                    task={task}
                    isSelected={selectedTaskId === task.taskId}
                    onClick={() => setSelectedTaskId(task.taskId)}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Timeline Canvas */}
            <div
              ref={timelineRef}
              className="flex-1 min-w-[700px] flex flex-col overflow-x-auto relative"
            >
              {/* Timeline Header */}
              <div className="h-10 bg-surface-low border-b border-border flex items-center text-[11px] font-mono text-text-muted">
                {timeColumns.map((col, idx) => (
                  <div
                    key={idx}
                    className="flex-1 text-center border-r border-border/50 truncate px-1"
                  >
                    {col.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </div>
                ))}
              </div>

              {/* Sprint Milestone Markers */}
              {sprints.map((sprint) => (
                <GanttMilestoneMarker
                  key={sprint.sprintId}
                  sprint={sprint}
                  leftPercent={getSprintMilestonePercent(sprint)}
                />
              ))}

              {/* Task Timeline Rows */}
              <div className="flex flex-col relative">
                {/* SVG Dependency Connectors Overlay */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-15"
                  style={{ minHeight: `${tasks.length * 40}px` }}
                >
                  <defs>
                    <marker
                      id="arrow-default"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                    </marker>
                    <marker
                      id="arrow-critical"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f59e0b" />
                    </marker>
                  </defs>
                  {dependencyEdges.map((edge) => (
                    <path
                      key={edge.id}
                      d={edge.pathD}
                      fill="none"
                      stroke={edge.isCritical ? '#f59e0b' : '#64748b'}
                      strokeWidth={edge.isCritical ? 2.5 : 1.5}
                      strokeDasharray={edge.isCritical ? undefined : '4 3'}
                      markerEnd={edge.isCritical ? 'url(#arrow-critical)' : 'url(#arrow-default)'}
                      className="transition-all duration-300"
                    />
                  ))}
                </svg>

                {tasks.map((task) => {
                  const { leftPercent, widthPercent } = getTaskBarCoords(task);
                  const isCritical =
                    showCriticalPath && cpmResult.criticalTaskIds.has(task.taskId);

                  return (
                    <div
                      key={task.taskId}
                      className="h-10 border-b border-border/50 relative flex items-center px-1"
                    >
                      {/* Grid vertical column lines */}
                      <div className="absolute inset-0 flex divide-x divide-border/30 pointer-events-none">
                        {timeColumns.map((_, i) => (
                          <div key={i} className="flex-1" />
                        ))}
                      </div>

                      {/* Task Bar */}
                      <div
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        onClick={() => setSelectedTaskId(task.taskId)}
                        className={`absolute h-6 rounded-md px-2 flex items-center justify-between text-[11px] font-medium text-white shadow-xs cursor-pointer hover:brightness-110 transition-all truncate z-20 ${
                          isCritical
                            ? 'bg-amber-600 ring-2 ring-amber-400'
                            : task.status === 'Done'
                            ? 'bg-emerald-600'
                            : 'bg-brand-emerald'
                        }`}
                      >
                        <span className="truncate">{task.title}</span>
                        {task.storyPoints !== undefined && (
                          <span className="text-[10px] opacity-80 shrink-0 ml-1">
                            {task.storyPoints}p
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
