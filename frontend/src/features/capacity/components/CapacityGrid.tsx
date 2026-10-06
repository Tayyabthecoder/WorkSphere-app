import React, { useMemo } from 'react';
import { TeamMember, Task } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';

interface CapacityGridProps {
  members: TeamMember[];
  tasks: Task[];
}

export const CapacityGrid: React.FC<CapacityGridProps> = ({ members, tasks }) => {
  // Generate 6 upcoming weekly intervals
  const weeks = useMemo(() => {
    const list = [];
    const now = new Date();
    // Monday of current week
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);

    for (let i = 0; i < 6; i++) {
      const start = new Date(monday);
      start.setDate(monday.getDate() + i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      list.push({ start, end, label });
    }
    return list;
  }, []);

  // Compute workload for each member for each week
  const getMemberWeekLoad = (memberId: string, weekStart: Date, weekEnd: Date) => {
    const memberTasks = tasks.filter((t) => {
      if (!t.assignees || !t.assignees.includes(memberId)) return false;
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate).getTime();
      return d >= weekStart.getTime() && d <= weekEnd.getTime();
    });

    const totalHours = memberTasks.reduce(
      (sum, t) => sum + (t.estimatedHours || (t.storyPoints ? t.storyPoints * 4 : 4)),
      0
    );

    const capacityHours = 40; // Standard 40h work week
    const percentage = Math.round((totalHours / capacityHours) * 100);

    return { totalHours, capacityHours, percentage, count: memberTasks.length };
  };

  return (
    <div className="bg-surface-card border border-border rounded-xl shadow-xs overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-surface-low text-xs font-semibold text-text-secondary">
            <th className="py-3 px-4 w-60">Team Member</th>
            {weeks.map((w, idx) => (
              <th key={idx} className="py-3 px-3 text-center">
                {w.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-xs">
          {members.map((member) => (
            <tr key={member.userId} className="hover:bg-surface-low/50 transition-colors">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                  <div className="truncate">
                    <span className="font-semibold text-text-primary block truncate">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-text-muted capitalize">
                      {member.role}
                    </span>
                  </div>
                </div>
              </td>

              {weeks.map((w, idx) => {
                const { totalHours, capacityHours, percentage, count } = getMemberWeekLoad(
                  member.userId,
                  w.start,
                  w.end
                );

                const cellColor =
                  percentage > 100
                    ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30'
                    : percentage >= 80
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    : percentage > 0
                    ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-surface-low text-text-muted';

                return (
                  <td key={idx} className="py-2 px-3 text-center">
                    <div
                      title={`${member.name}: ${totalHours}h assigned across ${count} tasks`}
                      className={`p-2 rounded-lg font-mono text-[11px] flex flex-col items-center justify-center transition-transform hover:scale-105 ${cellColor}`}
                    >
                      <span className="font-bold">{totalHours} hrs</span>
                      <span className="text-[10px] opacity-80">{percentage}%</span>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CapacityGrid;
