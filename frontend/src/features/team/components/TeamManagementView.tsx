import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Power,
  Mail,
  ChevronRight,
  Download,
  Filter,
  ArrowUpDown,
  Shield,
  Activity,
  UserCheck,
  UserX,
  Network,
  FolderKanban,
  GitBranch,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { useToast } from '../../../components/ui/ToastContext';
import { useAuthStore } from '../../../store/auth';
import { AddMemberModal } from './AddMemberModal';
import { DeactivateMemberModal } from './DeactivateMemberModal';
import { MemberDetailDrawer } from './MemberDetailDrawer';
import { PendingInvitationsTable } from './PendingInvitationsTable';
import { TeamsGridView } from './TeamsGridView';
import { OrgChartView } from './OrgChartView';
import { useTeam, useInvitations, useUpdateMember } from '../../../hooks/useTeam';
import { useTeams } from '../../../hooks/useTeams';
import { TeamMember } from '../../../types';
import {
  hasPermission,
  canChangeMemberRole,
  canDeactivateMember,
  getAssignableRoles,
} from '../../../lib/rbac';

export const TeamManagementView: React.FC = () => {
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.user);

  // Queries
  const { data: members = [], isLoading, refetch } = useTeam();
  const { data: teams = [], refetch: refetchTeams } = useTeams();
  const { data: invitations = [] } = useInvitations();
  const updateMemberMutation = useUpdateMember();

  // Navigation and Filter States
  const [activeTab, setActiveTab] = useState<'members' | 'squads' | 'orgchart' | 'invitations'>('members');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'role' | 'department' | 'activeTasks'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal and Drawer States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] = useState<TeamMember | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  // Departments List
  const departments = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [members]);

  // Filtered & Sorted Members
  const filteredMembers = useMemo(() => {
    let result = members.filter((m) => {
      if (selectedDept !== 'ALL' && m.department !== selectedDept) return false;
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'deactivated' && m.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q) ||
          m.department?.toLowerCase().includes(q)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'activeTasks') {
        valA = a.activeTasks || 0;
        valB = b.activeTasks || 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [members, selectedDept, statusFilter, searchQuery, sortField, sortAsc]);

  const handleSort = (field: 'name' | 'role' | 'department' | 'activeTasks') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const target = members.find((m) => m.userId === userId);
    if (!canChangeMemberRole(currentUser?.role, target?.role, userId === currentUser?.userId)) {
      toast.error('You do not have permission to modify this role');
      return;
    }
    try {
      await updateMemberMutation.mutateAsync({ userId, role: newRole as any });
      toast.success('Role tier updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    if (!canDeactivateMember(currentUser?.role, member.role, member.userId === currentUser?.userId)) {
      toast.error('You do not have permission to change this member status');
      return;
    }

    if (member.isActive) {
      // Opening safe deactivation dialog with task handover
      setMemberToDeactivate(member);
      setIsDeactivateModalOpen(true);
    } else {
      // Direct reactivation
      try {
        await updateMemberMutation.mutateAsync({ userId: member.userId, isActive: true });
        toast.success(`${member.name} has been reactivated`);
      } catch (err: any) {
        toast.error(err.response?.data?.error?.message || 'Failed to reactivate member');
      }
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Department', 'Status', 'Active Tasks', 'Completed Tasks'];
    const rows = filteredMembers.map((m) => [
      m.userId,
      `"${m.name.replace(/"/g, '""')}"`,
      m.email,
      m.role,
      m.department || 'General',
      m.isActive ? 'Active' : 'Deactivated',
      m.activeTasks || 0,
      m.completedTasks || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `team-roster-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Team roster exported to CSV');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Team Directory & Permissions
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage organization members, departments, pending invitations, and access tier assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              refetch();
              refetchTeams();
            }}
          >
            Refresh
          </Button>
          {hasPermission(currentUser?.role, 'user:invite') && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-4 border-b border-border overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-brand-emerald text-brand-emerald'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Workspace Members</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-surface-low text-text-secondary">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('squads')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'squads'
              ? 'border-brand-emerald text-brand-emerald'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Delivery Squads</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-surface-low text-text-secondary">
            {teams.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orgchart')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'orgchart'
              ? 'border-brand-emerald text-brand-emerald'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Organization Chart</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-brand-emerald/10 text-brand-emerald">
            Hierarchy
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'invitations'
              ? 'border-brand-emerald text-brand-emerald'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            <span>Pending Invitations</span>
          </div>
          {invitations.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-brand-emerald text-white font-bold">
              {invitations.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'invitations' ? (
        <PendingInvitationsTable />
      ) : activeTab === 'squads' ? (
        <TeamsGridView
          onMemberSelect={(m) => {
            setSelectedMember(m);
            setIsDrawerOpen(true);
          }}
        />
      ) : activeTab === 'orgchart' ? (
        <OrgChartView
          members={members}
          teams={teams}
          onMemberSelect={(m) => {
            setSelectedMember(m);
            setIsDrawerOpen(true);
          }}
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, department..."
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Members Only</option>
                <option value="deactivated">Deactivated Members Only</option>
              </select>

              {/* Department Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {departments.map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDept(dept)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      selectedDept === dept
                        ? 'bg-brand-emerald text-white font-semibold shadow-2xs'
                        : 'bg-surface-low text-text-secondary hover:text-text-primary hover:bg-surface-card'
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs font-mono text-text-muted">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
            </div>
          </Card>

          {/* Team Roster Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-text-primary select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Member</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-text-primary select-none"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Role Tier</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-text-primary select-none"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Department</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Squad</th>
                    <th className="py-3 px-3">Reports To</th>
                    <th
                      className="py-3 px-3 cursor-pointer hover:text-text-primary select-none"
                      onClick={() => handleSort('activeTasks')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Deliverables</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted">
                        Loading team directory...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted">
                        No team members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr
                        key={member.userId}
                        className="hover:bg-surface-low/50 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedMember(member);
                          setIsDrawerOpen(true);
                        }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={member.name}
                              src={member.avatarUrl}
                              size="sm"
                              isOnline={member.isActive}
                            />
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-primary group-hover:text-brand-emerald transition-colors">
                                {member.name}
                                {member.userId === currentUser?.userId && (
                                  <span className="ml-1.5 text-[10px] font-mono text-brand-emerald font-normal">
                                    (You)
                                  </span>
                                )}
                              </span>
                              {member.jobTitle && (
                                <span className="text-brand-emerald text-[10px] font-medium truncate">
                                  {member.jobTitle}
                                </span>
                              )}
                              <span className="text-text-secondary text-[11px]">
                                {member.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          {canChangeMemberRole(
                            currentUser?.role,
                            member.role,
                            member.userId === currentUser?.userId
                          ) ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                              className="h-8 px-2 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald cursor-pointer"
                            >
                              {getAssignableRoles(currentUser?.role, false).map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold capitalize ${
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
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-text-secondary font-medium">
                            {member.department || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {member.team ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-low border border-border/60">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: member.team.colorLabel || '#0D9488' }}
                              />
                              <span className="text-text-primary truncate max-w-[120px]">{member.team.name}</span>
                            </span>
                          ) : (
                            <span className="text-text-muted text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {member.reportsToUser ? (
                            <div className="flex flex-col min-w-0">
                              <span className="text-text-primary text-xs font-medium truncate max-w-[130px]">
                                {member.reportsToUser.name}
                              </span>
                              <span className="text-text-muted text-[10px] truncate max-w-[130px]">
                                {member.reportsToUser.jobTitle || member.reportsToUser.role}
                              </span>
                            </div>
                          ) : (
                            <span className="text-text-muted text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="font-semibold text-text-primary">
                            {member.activeTasks || 0}
                          </span>
                          <span className="text-text-muted text-[11px] ml-1">active</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={member.isActive ? 'completed' : 'neutral'}
                            size="sm"
                            dot
                          >
                            {member.isActive ? 'Active' : 'Deactivated'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {canDeactivateMember(
                              currentUser?.role,
                              member.role,
                              member.userId === currentUser?.userId
                            ) && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(member)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  member.isActive
                                    ? 'text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                    : 'text-text-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                                }`}
                                title={member.isActive ? 'Deactivate member' : 'Reactivate member'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsDrawerOpen(true);
                              }}
                              className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-low transition-colors"
                              title="View member details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Direct Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={() => refetch()}
        existingDepartments={departments}
      />

      {/* Safe Deactivate Member Modal */}
      <DeactivateMemberModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setMemberToDeactivate(null);
        }}
        member={memberToDeactivate}
        activeMembers={members}
        onSuccess={() => refetch()}
      />

      {/* Member Profile Drawer */}
      <MemberDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        isCurrentUser={selectedMember?.userId === currentUser?.userId}
        onDeactivateClick={(m) => {
          setIsDrawerOpen(false);
          setMemberToDeactivate(m);
          setIsDeactivateModalOpen(true);
        }}
        onRoleChange={handleRoleChange}
      />
    </div>
  );
};

export default TeamManagementView;
