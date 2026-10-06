import React from 'react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Users } from 'lucide-react';

export interface TeamMemberCollab {
  name: string;
  avatar?: string;
  task: string;
  status: 'completed' | 'progress' | 'pending';
  statusLabel: string;
}

interface TeamCollabCardProps {
  members?: TeamMemberCollab[];
}

export const TeamCollabCard: React.FC<TeamCollabCardProps> = ({ members = [] }) => {
  return (
    <div className="p-5 rounded-xl bg-surface-card border border-border/80 shadow-xs flex flex-col justify-between h-[280px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-surface-low border border-border/60 flex items-center justify-center text-brand-emerald shadow-2xs">
            <Users className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-text-primary tracking-tight">Team Presence & Focus</h3>
        </div>
        <span className="text-[10px] font-mono tabular-nums font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
          {members.length} Active
        </span>
      </div>

      {/* Member rows */}
      <div className="flex flex-col gap-2 my-auto overflow-y-auto pr-1">
        {members.length > 0 ? (
          members.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-1.5 rounded-lg hover:bg-surface-low/60 transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Avatar name={m.name} src={m.avatar} size="sm" isOnline />
                <div className="flex flex-col truncate">
                  <span className="text-xs font-semibold text-text-primary truncate">{m.name}</span>
                  <span className="text-[11px] text-text-secondary truncate">{m.task}</span>
                </div>
              </div>
              <Badge variant={m.status} size="sm" dot>
                {m.statusLabel}
              </Badge>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-text-muted">
            No active team presence recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCollabCard;
