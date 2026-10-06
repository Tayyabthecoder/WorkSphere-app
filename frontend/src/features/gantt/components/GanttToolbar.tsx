import React from 'react';
import { Layers, FolderKanban, Calendar, Sparkles } from 'lucide-react';
import { Project } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface GanttToolbarProps {
  projects: Project[];
  selectedProjectId: string;
  onChangeProject: (id: string) => void;
  zoomMode: 'day' | 'week' | 'month';
  onChangeZoomMode: (mode: 'day' | 'week' | 'month') => void;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
}

export const GanttToolbar: React.FC<GanttToolbarProps> = ({
  projects,
  selectedProjectId,
  onChangeProject,
  zoomMode,
  onChangeZoomMode,
  showCriticalPath,
  onToggleCriticalPath,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-card border border-border rounded-xl shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Project Selector */}
        <div className="flex items-center gap-2 bg-surface-low border border-border px-3 py-1.5 rounded-lg">
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

        {/* Critical Path Toggle */}
        <Button
          variant={showCriticalPath ? 'primary' : 'outline'}
          size="sm"
          onClick={onToggleCriticalPath}
          className="text-xs h-8"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
          Critical Path
        </Button>
      </div>

      {/* Zoom Mode */}
      <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-surface-low">
        {(['day', 'week', 'month'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChangeZoomMode(mode)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
              zoomMode === mode
                ? 'bg-surface-card text-brand-emerald font-semibold shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {mode} view
          </button>
        ))}
      </div>
    </div>
  );
};

export default GanttToolbar;
