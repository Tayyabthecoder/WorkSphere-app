import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2 } from 'lucide-react';
import { useProjects } from '../../../hooks/useProjects';
import { useTasks } from '../../../hooks/useTasks';
import { useSprints } from '../../../hooks/useSprints';
import { CalendarToolbar } from './CalendarToolbar';
import { CalendarFilters } from './CalendarFilters';
import { CalendarEventCard } from './CalendarEventCard';
import { CreateTaskFromCalendar } from './CreateTaskFromCalendar';

interface CalendarViewProps {
  projectId?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || 'all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'tasks' | 'sprints'>('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const effectiveProjectId = projectId || selectedProjectId;

  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks(
    effectiveProjectId === 'all' ? undefined : { projectId: effectiveProjectId }
  );

  const { data: sprints = [], isLoading: isLoadingSprints } = useSprints(
    effectiveProjectId === 'all' ? 'all' : effectiveProjectId
  );

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Month navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar cells generation for Month view
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const cells = [];

    // Previous month filler
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthLast - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month filler to round to 35 or 42
    const totalCurrentCells = cells.length;
    const remainder = (7 - (totalCurrentCells % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentDate]);

  // Week view 7 days
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Filter tasks & sprints
  const filteredTasks = useMemo(() => {
    if (typeFilter === 'sprints') return [];
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, typeFilter, priorityFilter]);

  const filteredSprints = useMemo(() => {
    if (typeFilter === 'tasks') return [];
    return sprints;
  }, [sprints, typeFilter]);

  // Map events to date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    const dayTasks = filteredTasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate.split('T')[0] === dateStr;
    });

    const daySprints = filteredSprints.filter((s) => {
      const start = s.startDate.split('T')[0];
      const end = s.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });

    return [
      ...daySprints.map((s) => ({ type: 'sprint' as const, data: s })),
      ...dayTasks.map((t) => ({ type: 'task' as const, data: t })),
    ];
  };

  const handleSlotClick = (date: Date) => {
    setSelectedSlotDate(date);
    setIsQuickAddOpen(true);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="flex flex-col gap-5 p-6 max-w-7xl mx-auto w-full">
      {/* Top Title & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-text-primary">Deliverable Calendar</h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-brand-emerald/10 text-brand-emerald rounded-full">
              Timeline & Deadlines
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Visual calendar schedule of all project tasks, milestones, and active sprint intervals.
          </p>
        </div>

        {!projectId && (
          <CalendarFilters
            projects={projects}
            selectedProjectId={selectedProjectId}
            onChangeProject={setSelectedProjectId}
            typeFilter={typeFilter}
            onChangeTypeFilter={setTypeFilter}
            priorityFilter={priorityFilter}
            onChangePriorityFilter={setPriorityFilter}
          />
        )}
      </div>

      {/* Calendar Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* Loading state */}
      {isLoadingTasks || isLoadingSprints ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
          <span className="text-xs">Loading calendar events...</span>
        </div>
      ) : viewMode === 'month' ? (
        /* Month Grid */
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden shadow-xs">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-border bg-surface-low text-center py-2 text-xs font-semibold text-text-secondary">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border">
            {monthDays.map((cell, idx) => {
              const events = getEventsForDate(cell.date);
              const today = isToday(cell.date);

              return (
                <div
                  key={idx}
                  onClick={() => handleSlotClick(cell.date)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                    cell.isCurrentMonth
                      ? 'bg-surface-card hover:bg-surface-low/60'
                      : 'bg-surface-low/30 text-text-muted hover:bg-surface-low/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                        today
                          ? 'bg-brand-emerald text-white font-bold'
                          : cell.isCurrentMonth
                          ? 'text-text-primary'
                          : 'text-text-muted'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSlotClick(cell.date);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-text-muted hover:text-brand-emerald transition-opacity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Event Badges List */}
                  <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                    {events.slice(0, 3).map((item, i) => (
                      <CalendarEventCard
                        key={i}
                        item={item}
                        onClick={() => {
                          if (item.type === 'sprint') {
                            navigate(`/sprints/${item.data.projectId}`);
                          } else {
                            navigate('/tasks');
                          }
                        }}
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[10px] text-text-muted font-medium pl-1">
                        +{events.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        /* Week View */
        <div className="bg-surface-card border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-7 border-b border-border bg-surface-low text-center py-2 text-xs font-semibold text-text-secondary">
            {weekDays.map((d, i) => (
              <span key={i}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })} {d.getDate()}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-border min-h-[400px]">
            {weekDays.map((d, i) => {
              const events = getEventsForDate(d);
              return (
                <div
                  key={i}
                  onClick={() => handleSlotClick(d)}
                  className="p-2.5 flex flex-col gap-1.5 hover:bg-surface-low/60 cursor-pointer"
                >
                  {events.map((item, idx) => (
                    <CalendarEventCard
                      key={idx}
                      item={item}
                      onClick={() => navigate('/tasks')}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="bg-surface-card border border-border rounded-xl p-5 shadow-xs flex flex-col gap-4">
          <h3 className="font-semibold text-text-primary text-sm">Upcoming Deadlines & Schedule</h3>
          <div className="flex flex-col gap-2">
            {tasks.filter((t) => !!t.dueDate).length === 0 ? (
              <div className="py-12 text-center text-xs text-text-muted">
                No scheduled tasks found for this view.
              </div>
            ) : (
              tasks
                .filter((t) => !!t.dueDate)
                .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
                .map((task) => (
                  <div
                    key={task.taskId}
                    onClick={() => navigate('/tasks')}
                    className="p-3 bg-surface-low rounded-xl border border-border hover:border-brand-emerald/40 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-text-primary">{task.title}</h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Due: {new Date(task.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="text-xs font-medium capitalize px-2 py-0.5 rounded bg-surface-card border border-border">
                      {task.status}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      <CreateTaskFromCalendar
        initialDate={selectedSlotDate}
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setSelectedSlotDate(null);
        }}
      />
    </div>
  );
};

export default CalendarView;
