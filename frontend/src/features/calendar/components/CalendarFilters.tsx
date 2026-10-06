import React from 'react';
import { Filter, FolderKanban } from 'lucide-react';
import { Project } from '../../../types';

interface CalendarFiltersProps {
  projects: Project[];
  selectedProjectId: string;
  onChangeProject: (id: string) => void;
  typeFilter: 'all' | 'tasks' | 'sprints';
  onChangeTypeFilter: (type: 'all' | 'tasks' | 'sprints') => void;
  priorityFilter: string;
  onChangePriorityFilter: (p: string) => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  projects,
  selectedProjectId,
  onChangeProject,
  typeFilter,
  onChangeTypeFilter,
  priorityFilter,
  onChangePriorityFilter,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Project */}
      <div className="flex items-center gap-2 bg-surface-card border border-border px-3 py-1.5 rounded-lg shadow-2xs">
        <FolderKanban className="w-4 h-4 text-text-muted" />
        <select
          value={selectedProjectId}
          onChange={(e) => onChangeProject(e.target.value)}
          className="bg-transparent text-xs font-medium text-text-primary focus:outline-none"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.projectId} value={p.projectId}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type Toggle */}
      <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-surface-card">
        {(['all', 'tasks', 'sprints'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onChangeTypeFilter(t)}
            className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
              typeFilter === t
                ? 'bg-brand-emerald/10 text-brand-emerald font-semibold'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Priority */}
      <select
        value={priorityFilter as any}
        onChange={(e) => onChangePriorityFilter(e.target.value)}
        className="px-3 py-1.5 bg-surface-card border border-border rounded-lg text-xs text-text-secondary focus:outline-none capitalize"
      >
        <option value="all">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
};

export default CalendarFilters;
