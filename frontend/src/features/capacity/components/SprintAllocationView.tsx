import React from 'react';
import { Sprint, TeamMember, Task } from '../../../types';
import { Zap, Users, AlertCircle } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { CapacityAllocationBar } from './CapacityAllocationBar';

interface SprintAllocationViewProps {
  sprints: Sprint[];
  members: TeamMember[];
  tasks: Task[];
}

export const SprintAllocationView: React.FC<SprintAllocationViewProps> = ({
  sprints,
  members,
  tasks,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {sprints.map((sprint) => {
        const sprintTasks = tasks.filter((t) => t.sprintId === sprint.sprintId);
        const totalCommitted = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const capacity = sprint.capacityPoints || 30;

        return (
          <div
            key={sprint.sprintId}
            className="p-5 bg-surface-card border border-border rounded-xl shadow-xs flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h4 className="font-semibold text-text-primary text-sm">{sprint.name}</h4>
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-text-primary block">
                  {totalCommitted} / {capacity} pts
                </span>
                <span className="text-[10px] text-text-muted capitalize">
                  {sprint.status}
                </span>
              </div>
            </div>

            <CapacityAllocationBar
              allocated={totalCommitted}
              capacity={capacity}
              unit="pts"
            />

            {/* Member points break down */}
            <div className="flex flex-col gap-2 mt-1">
              <span className="text-[11px] font-semibold text-text-secondary">
                Points by Assignee:
              </span>
              <div className="flex flex-col gap-1.5">
                {members.slice(0, 4).map((member) => {
                  const memberSprintPoints = sprintTasks
                    .filter((t) => t.assignees?.includes(member.userId))
                    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded-lg bg-surface-low text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                        <span className="font-medium text-text-primary">{member.name}</span>
                      </div>
                      <span className="font-mono text-text-secondary">{memberSprintPoints} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SprintAllocationView;
