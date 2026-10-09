import React from 'react';
import {
  X,
  Mail,
  Building,
  Shield,
  Clock,
  CheckCircle2,
  Calendar,
  Briefcase,
  AlertCircle,
  Activity,
  Layers,
  Users,
  GitBranch,
} from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../../../store/auth';
import {
  canChangeMemberRole,
  canDeactivateMember,
  getAssignableRoles,
} from '../../../lib/rbac';
import { TeamMember } from '../../../types';

interface MemberDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onDeactivateClick: (member: TeamMember) => void;
  onRoleChange: (userId: string, newRole: string) => void;
  isCurrentUser: boolean;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  isOpen,
  onClose,
  member,
  onDeactivateClick,
  onRoleChange,
  isCurrentUser,
}) => {
  if (!isOpen || !member) return null;

  const currentUser = useAuthStore((state) => state.user);
  const canEditRole = canChangeMemberRole(currentUser?.role, member.role, isCurrentUser);
  const canDeactivate = canDeactivateMember(currentUser?.role, member.role, isCurrentUser);
  const assignableRoles = getAssignableRoles(currentUser?.role, false);

  const totalTasks = (member.activeTasks || 0) + (member.completedTasks || 0);
  const completionRate =
    totalTasks > 0 ? Math.round(((member.completedTasks || 0) / totalTasks) * 100) : 0;

  const roleDescriptions: Record<string, string> = {
    superAdmin: 'Platform administrator with cross-tenant management.',
    orgAdmin: 'Organization administrator managing users, projects, and billing.',
    managingDirector: 'Executive leader overseeing all department managers, squads, and company goals.',
    hr: 'People operations managing company-wide hiring, personnel records, and employee success.',
    manager: 'Squad supervisor directing team delivery, sprint backlogs, and team members.',
    teamLeader: 'Operational squad lead; guides sprint tasks, collaborates with teammates, and reviews timesheets.',
    member: 'Core team contributor delivering tasks and collaborating on sprints.',
    viewer: 'Read-only stakeholder access.',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface-card border-l border-border shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-border/80 flex items-start justify-between bg-surface-low/50">
            <div className="flex items-center gap-3.5">
              <Avatar
                name={member.name}
                src={member.avatarUrl}
                size="lg"
                isOnline={member.isActive}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text-primary">{member.name}</h3>
                  {isCurrentUser && (
                    <span className="text-[10px] font-mono text-brand-emerald bg-brand-emerald/10 px-1.5 py-0.5 rounded-sm">
                      You
                    </span>
                  )}
                </div>
                {member.jobTitle && (
                  <span className="text-xs font-medium text-brand-emerald">{member.jobTitle}</span>
                )}
                <span className="text-xs text-text-secondary">{member.email}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={member.isActive ? 'completed' : 'neutral'} size="sm" dot>
                    {member.isActive ? 'Active' : 'Deactivated'}
                  </Badge>
                  <span className="text-[11px] font-medium text-text-muted capitalize">
                    {member.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-low transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-surface-low rounded-xl border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted">
                  <span>Active Tasks</span>
                  <Activity className="w-4 h-4 text-brand-emerald" />
                </div>
                <span className="text-xl font-bold font-mono text-text-primary mt-2">
                  {member.activeTasks || 0}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5">Currently in delivery</span>
              </div>

              <div className="p-3.5 bg-surface-low rounded-xl border border-border flex flex-col justify-between">
                <div className="flex items-center justify-between text-text-muted">
                  <span>Completed Tasks</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xl font-bold font-mono text-text-primary mt-2">
                  {member.completedTasks || 0}
                </span>
                <span className="text-[10px] text-text-muted mt-0.5">{completionRate}% completion rate</span>
              </div>
            </div>

            {/* Profile Information */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono text-text-muted">
                Profile & Squad Hierarchy
              </h4>

              <div className="space-y-2 bg-surface-low p-3.5 rounded-xl border border-border">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Assigned Squad
                  </span>
                  <span className="font-semibold text-text-primary flex items-center gap-1.5">
                    {member.team ? (
                      <>
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: member.team.colorLabel || '#0D9488' }}
                        />
                        <span>{member.team.name}</span>
                      </>
                    ) : (
                      <span className="text-text-muted font-normal">(Unassigned)</span>
                    )}
                  </span>
                </div>

                {member.reportsToUser && (
                  <div className="flex items-center justify-between py-1 border-b border-border/60">
                    <span className="text-text-muted flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" /> Reports To
                    </span>
                    <span className="font-medium text-text-primary">
                      {member.reportsToUser.name} ({member.reportsToUser.jobTitle || member.reportsToUser.role})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" /> Department
                  </span>
                  <span className="font-semibold text-text-primary">
                    {member.department || 'General'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email
                  </span>
                  <span className="font-mono text-text-primary truncate max-w-[200px]">
                    {member.email}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Joined Date
                  </span>
                  <span className="text-text-primary">
                    {member.createdAt
                      ? new Date(member.createdAt).toLocaleDateString()
                      : 'Established'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> User ID
                  </span>
                  <span className="font-mono text-text-muted text-[10px]">
                    {member.userId}
                  </span>
                </div>
              </div>
            </div>

            {/* Access & Role Tier */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-mono text-text-muted">
                Access & Permissions
              </h4>

              <div className="p-3.5 bg-surface-low rounded-xl border border-border space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                    Assigned Role Tier
                  </label>
                  {canEditRole ? (
                    <select
                      value={member.role}
                      onChange={(e) => onRoleChange(member.userId, e.target.value)}
                      className="w-full h-8 px-2.5 rounded-lg text-xs bg-surface-card border border-border text-text-primary focus:outline-none focus:border-brand-emerald cursor-pointer"
                    >
                      {assignableRoles.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize ${
                          member.role === 'superAdmin'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            : member.role === 'orgAdmin'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                            : member.role === 'manager'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : 'bg-surface-low text-text-secondary border border-border/60'
                        }`}
                      >
                        {member.role === 'orgAdmin'
                          ? 'Org Admin'
                          : member.role === 'superAdmin'
                          ? 'Super Admin'
                          : member.role}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {isCurrentUser ? '(Your own account tier)' : '(Read-only managed tier)'}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  {roleDescriptions[member.role] || roleDescriptions.member}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border/80 bg-surface-low/50 flex items-center justify-between">
            {canDeactivate ? (
              <Button
                variant={member.isActive ? 'danger' : 'outline'}
                size="sm"
                onClick={() => onDeactivateClick(member)}
              >
                {member.isActive ? 'Deactivate Member...' : 'Reactivate Member'}
              </Button>
            ) : (
              <div />
            )}

            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDetailDrawer;
