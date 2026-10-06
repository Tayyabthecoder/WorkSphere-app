import React from 'react';
import { Sprint } from '../../../types';

interface GanttMilestoneMarkerProps {
  sprint: Sprint;
  leftPercent: number;
}

export const GanttMilestoneMarker: React.FC<GanttMilestoneMarkerProps> = ({
  sprint,
  leftPercent,
}) => {
  return (
    <div
      style={{ left: `${leftPercent}%` }}
      className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-emerald-500/60 z-10 pointer-events-none group"
    >
      <div className="absolute top-1 -left-2 w-4 h-4 bg-emerald-600 rotate-45 rounded-xs shadow-md pointer-events-auto cursor-pointer" />
      <div className="absolute top-6 left-1 bg-surface-card border border-border rounded px-2 py-0.5 text-[10px] text-text-primary whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {sprint.name} Milestone ({new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
      </div>
    </div>
  );
};

export default GanttMilestoneMarker;
