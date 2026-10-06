import React from 'react';
import { TeamMember } from '../../../types';
import { Avatar } from '../../../components/ui/Avatar';
import { CapacityAllocationBar } from './CapacityAllocationBar';

interface CapacityMemberRowProps {
  member: TeamMember;
  allocatedHours: number;
  totalCapacityHours: number;
}

export const CapacityMemberRow: React.FC<CapacityMemberRowProps> = ({
  member,
  allocatedHours,
  totalCapacityHours,
}) => {
  return (
    <div className="flex items-center justify-between p-3.5 bg-surface-card border border-border rounded-xl hover:border-brand-emerald/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0 w-64 shrink-0">
        <Avatar name={member.name} src={member.avatarUrl} size="sm" />
        <div className="truncate">
          <h4 className="font-semibold text-text-primary text-xs truncate">{member.name}</h4>
          <span className="text-[11px] text-text-muted capitalize">
            {member.role} • {member.department || 'General'}
          </span>
        </div>
      </div>

      <div className="flex-1 max-w-md px-4">
        <CapacityAllocationBar
          allocated={allocatedHours}
          capacity={totalCapacityHours}
          unit="hrs"
        />
      </div>

      <div className="text-right text-xs shrink-0 w-28">
        <span className="text-text-muted">Active Tasks:</span>{' '}
        <strong className="text-text-primary">{member.activeTasks || 0}</strong>
      </div>
    </div>
  );
};

export default CapacityMemberRow;
