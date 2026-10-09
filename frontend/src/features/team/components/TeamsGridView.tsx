import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Shield,
  UserCheck,
  UserPlus,
  Trash2,
  Edit2,
  FolderKanban,
  CheckCircle2,
  Activity,
  Search,
  Filter,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Crown,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/ToastContext';
import { useAuthStore } from '../../../store/auth';
import {
  useTeams,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMembers,
  useRemoveTeamMember,
} from '../../../hooks/useTeams';
import { useTeam } from '../../../hooks/useTeam';
import { Team, TeamMember } from '../../../types';

interface TeamsGridViewProps {
  onMemberSelect?: (member: TeamMember) => void;
}

export const TeamsGridView: React.FC<TeamsGridViewProps> = ({ onMemberSelect }) => {
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.user);

  const { data: teams = [], isLoading: isTeamsLoading } = useTeams();
  const { data: allMembers = [] } = useTeam();

  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();
  const addMembersMutation = useAddTeamMembers();
  const removeMemberMutation = useRemoveTeamMember();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [squadToManageMembers, setSquadToManageMembers] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  // Form states for Create/Edit
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamDept, setTeamDept] = useState('Engineering');
  const [teamManagerId, setTeamManagerId] = useState('');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [teamColor, setTeamColor] = useState('#0D9488');
  const [formError, setFormError] = useState('');

  // Form state for Adding Member to Squad
  const [memberToAddId, setMemberToAddId] = useState('');

  const isGlobalAdmin = ['superAdmin', 'orgAdmin', 'managingDirector', 'hr'].includes(
    currentUser?.role || ''
  );

  // Department options
  const departments = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => {
      if (t.department) set.add(t.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [teams]);

  // Available managers for squad assignment
  const eligibleManagers = useMemo(() => {
    return allMembers.filter(
      (m) =>
        m.isActive &&
        ['manager', 'managingDirector', 'orgAdmin', 'superAdmin'].includes(m.role)
    );
  }, [allMembers]);

  // Available team leaders for squad assignment
  const eligibleLeaders = useMemo(() => {
    return allMembers.filter(
      (m) =>
        m.isActive &&
        ['teamLeader', 'member', 'manager'].includes(m.role)
    );
  }, [allMembers]);

  // Unassigned members (or members eligible to join)
  const unassignedMembers = useMemo(() => {
    return allMembers.filter((m) => m.isActive && !m.teamId);
  }, [allMembers]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (selectedDept !== 'ALL' && t.department !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.manager?.name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [teams, selectedDept, searchQuery]);

  const openCreateModal = () => {
    setTeamName('');
    setTeamDesc('');
    setTeamDept('Engineering');
    setTeamManagerId(
      currentUser?.role === 'manager'
        ? currentUser.userId
        : eligibleManagers[0]?.userId || ''
    );
    setTeamLeaderId('');
    setTeamColor('#0D9488');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setTeamDesc(team.description || '');
    setTeamDept(team.department);
    setTeamManagerId(team.managerId);
    setTeamLeaderId(team.leaderId || '');
    setTeamColor(team.colorLabel || '#0D9488');
    setFormError('');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setFormError('Squad name is required');
      return;
    }
    if (!teamManagerId) {
      setFormError('A squad manager must be selected');
      return;
    }

    try {
      await createTeamMutation.mutateAsync({
        name: teamName.trim(),
        description: teamDesc.trim(),
        department: teamDept,
        managerId: teamManagerId,
        leaderId: teamLeaderId || null,
        colorLabel: teamColor,
      });
      toast.success(`Squad "${teamName}" created successfully`);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to create squad');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    if (!teamName.trim()) {
      setFormError('Squad name is required');
      return;
    }

    try {
      await updateTeamMutation.mutateAsync({
        teamId: editingTeam.teamId,
        name: teamName.trim(),
        description: teamDesc.trim(),
        department: isGlobalAdmin ? teamDept : undefined,
        managerId: isGlobalAdmin ? teamManagerId : undefined,
        leaderId: teamLeaderId || null,
        colorLabel: teamColor,
      });
      toast.success(`Squad "${teamName}" updated successfully`);
      setEditingTeam(null);
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || err.message || 'Failed to update squad');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!teamToDelete) return;
    try {
      await deleteTeamMutation.mutateAsync(teamToDelete.teamId);
      toast.success(`Squad "${teamToDelete.name}" disbanded`);
      setTeamToDelete(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to disband squad');
    }
  };

  const handleAddMemberToSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadToManageMembers || !memberToAddId) return;

    try {
      await addMembersMutation.mutateAsync({
        teamId: squadToManageMembers.teamId,
        userIds: [memberToAddId],
      });
      toast.success('Member assigned to squad');
      setMemberToAddId('');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string, memberName: string) => {
    try {
      await removeMemberMutation.mutateAsync({ teamId, userId: memberId });
      toast.success(`${memberName} unassigned from squad`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to remove member');
    }
  };

  const colorPresets = [
    { label: 'Emerald', hex: '#0D9488' },
    { label: 'Indigo', hex: '#6366F1' },
    { label: 'Blue', hex: '#3B82F6' },
    { label: 'Amber', hex: '#F59E0B' },
    { label: 'Rose', hex: '#F43F5E' },
    { label: 'Purple', hex: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-card p-4 rounded-xl border border-border">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search squads by name, manager, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'ALL' ? 'All Departments' : dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isGlobalAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="flex items-center gap-2 whitespace-nowrap bg-brand-emerald hover:bg-emerald-600 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Create Squad</span>
          </Button>
        )}
      </div>

      {/* Squad Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-surface-card rounded-xl border border-border flex flex-col">
          <span className="text-[11px] font-medium text-text-muted">Total Squads</span>
          <span className="text-xl font-bold font-mono text-text-primary mt-1">
            {teams.length}
          </span>
        </div>
        <div className="p-3 bg-surface-card rounded-xl border border-border flex flex-col">
          <span className="text-[11px] font-medium text-text-muted">Assigned Members</span>
          <span className="text-xl font-bold font-mono text-brand-emerald mt-1">
            {teams.reduce((acc, t) => acc + (t.memberIds?.length || 0), 0)}
          </span>
        </div>
        <div className="p-3 bg-surface-card rounded-xl border border-border flex flex-col">
          <span className="text-[11px] font-medium text-text-muted">Unassigned Members</span>
          <span className="text-xl font-bold font-mono text-amber-500 mt-1">
            {unassignedMembers.length}
          </span>
        </div>
        <div className="p-3 bg-surface-card rounded-xl border border-border flex flex-col">
          <span className="text-[11px] font-medium text-text-muted">Active Squad Leads</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1">
            {new Set(teams.map((t) => t.managerId)).size}
          </span>
        </div>
      </div>

      {/* Squads Grid */}
      {isTeamsLoading ? (
        <div className="py-12 text-center text-xs text-text-muted">Loading squads...</div>
      ) : filteredTeams.length === 0 ? (
        <div className="py-16 text-center bg-surface-card rounded-xl border border-border/70 p-6 flex flex-col items-center justify-center">
          <Users className="w-12 h-12 text-text-muted/40 mb-3" />
          <h3 className="text-sm font-semibold text-text-primary">No Squads Found</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm">
            {searchQuery
              ? 'No squads match your search filters.'
              : 'Create your first delivery squad to organize members under managers.'}
          </p>
          {isGlobalAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateModal}
              className="mt-4 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Squad
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const canManageThisTeam =
              isGlobalAdmin || (currentUser?.role === 'manager' && team.managerId === currentUser.userId);

            const membersList = team.members || [];
            const totalActiveTasks = membersList.reduce(
              (sum, m) => sum + (m.activeTasks || 0),
              0
            );

            return (
              <Card
                key={team.teamId}
                className="overflow-hidden border-border/80 flex flex-col justify-between hover:border-border transition-all duration-200"
              >
                {/* Colored Top Accent Bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: team.colorLabel || '#0D9488' }}
                />

                <div className="p-4 flex-1 flex flex-col justify-between">
                  {/* Squad Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-text-primary">{team.name}</h3>
                          <Badge variant="neutral" size="sm">
                            {team.department}
                          </Badge>
                        </div>
                        {team.description && (
                          <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                            {team.description}
                          </p>
                        )}
                      </div>

                      {canManageThisTeam && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(team)}
                            title="Edit Squad"
                            className="p-1 text-text-muted hover:text-text-primary rounded-md hover:bg-surface-low transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {isGlobalAdmin && (
                            <button
                              type="button"
                              onClick={() => setTeamToDelete(team)}
                              title="Disband Squad"
                              className="p-1 text-text-muted hover:text-red-500 rounded-md hover:bg-surface-low transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Squad Manager Card */}
                    <div className="mt-4 p-2.5 bg-surface-low rounded-lg border border-border/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={team.manager?.name || 'Manager'}
                          src={team.manager?.avatarUrl}
                          size="sm"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-text-primary">
                            {team.manager?.name || 'Unassigned Lead'}
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {team.manager?.jobTitle || 'Squad Manager'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="completed" size="sm">
                        Manager
                      </Badge>
                    </div>

                    {/* Designated Team Leader Card (if present) */}
                    {team.leader && (
                      <div className="mt-2 p-2 bg-teal-500/10 rounded-lg border border-teal-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0">
                            <Avatar
                              name={team.leader.name}
                              src={team.leader.avatarUrl}
                              size="sm"
                            />
                            <div className="absolute -top-1 -right-1 bg-teal-600 text-white rounded-full p-0.5 shadow-xs">
                              <Crown className="w-2.5 h-2.5" />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-text-primary">
                              {team.leader.name}
                            </span>
                            <span className="text-[10px] text-teal-400">
                              {team.leader.jobTitle || 'Team Leader'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-teal-400 bg-teal-500/20 px-1.5 py-0.5 rounded-xs">
                          Team Lead
                        </span>
                      </div>
                    )}

                    {/* Member Avatars & Stats */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-text-muted font-medium">
                          Squad Members ({membersList.length})
                        </span>
                        <span className="text-text-muted font-mono flex items-center gap-1">
                          <Activity className="w-3 h-3 text-brand-emerald" />
                          {totalActiveTasks} active tasks
                        </span>
                      </div>

                      {membersList.length === 0 ? (
                        <div className="py-4 text-center text-[11px] text-text-muted bg-surface-low/50 rounded-lg border border-dashed border-border/60">
                          No members assigned yet
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {membersList.map((m) => {
                            const isLeader = m.userId === team.leaderId || m.role === 'teamLeader';
                            return (
                              <div
                                key={m.userId}
                                onClick={() => onMemberSelect?.(m as any)}
                                className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-low cursor-pointer transition-colors"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                                  <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs text-text-primary truncate font-medium group-hover:text-brand-emerald transition-colors">
                                        {m.name}
                                      </span>
                                      {isLeader && (
                                        <span className="text-[8px] font-bold text-teal-400 bg-teal-500/20 px-1 rounded-xs">
                                          Lead
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-text-muted truncate">
                                      {m.jobTitle || m.role}
                                    </span>
                                  </div>
                                </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-text-muted">
                                  {m.activeTasks || 0} tasks
                                </span>
                                {canManageThisTeam && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveMember(team.teamId, m.userId, m.name);
                                    }}
                                    title="Unassign Member"
                                    className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 rounded-md transition-opacity"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  {canManageThisTeam && (
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSquadToManageMembers(team)}
                        className="text-xs text-brand-emerald hover:text-emerald-500 flex items-center gap-1.5 px-2 py-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </Button>

                      <span className="text-[10px] text-text-muted font-mono">
                        {team.teamId}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Create Squad */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Delivery Squad"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Squad Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Team 1 (Frontend Core)"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description
            </label>
            <Input
              type="text"
              placeholder="e.g., Responsible for web applications and user experience"
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Department
              </label>
              <Input
                type="text"
                placeholder="Engineering"
                value={teamDept}
                onChange={(e) => setTeamDept(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Assigned Squad Lead (Manager) *
              </label>
              <select
                value={teamManagerId}
                onChange={(e) => setTeamManagerId(e.target.value)}
                disabled={currentUser?.role === 'manager'}
                className="w-full px-3 py-2 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                required
              >
                {eligibleManagers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Designated Team Leader (Optional)
            </label>
            <select
              value={teamLeaderId}
              onChange={(e) => setTeamLeaderId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
            >
              <option value="">None / Unassigned</option>
              {eligibleLeaders.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setTeamColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    teamColor === c.hex ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createTeamMutation.isPending}
              className="bg-brand-emerald text-white hover:bg-emerald-600"
            >
              {createTeamMutation.isPending ? 'Creating...' : 'Create Squad'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Squad */}
      <Modal
        isOpen={Boolean(editingTeam)}
        onClose={() => setEditingTeam(null)}
        title={`Edit Squad: ${editingTeam?.name || ''}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Squad Name *
            </label>
            <Input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Description
            </label>
            <Input
              type="text"
              value={teamDesc}
              onChange={(e) => setTeamDesc(e.target.value)}
            />
          </div>

          {isGlobalAdmin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Department
                </label>
                <Input
                  type="text"
                  value={teamDept}
                  onChange={(e) => setTeamDept(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Assigned Squad Lead
                </label>
                <select
                  value={teamManagerId}
                  onChange={(e) => setTeamManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                >
                  {eligibleManagers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Designated Team Leader (Optional)
            </label>
            <select
              value={teamLeaderId}
              onChange={(e) => setTeamLeaderId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
            >
              <option value="">None / Unassigned</option>
              {eligibleLeaders.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setTeamColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    teamColor === c.hex ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingTeam(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={updateTeamMutation.isPending}
              className="bg-brand-emerald text-white hover:bg-emerald-600"
            >
              {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Member to Squad */}
      <Modal
        isOpen={Boolean(squadToManageMembers)}
        onClose={() => setSquadToManageMembers(null)}
        title={`Add Member to ${squadToManageMembers?.name || 'Squad'}`}
      >
        <form onSubmit={handleAddMemberToSquad} className="space-y-4">
          <p className="text-xs text-text-muted">
            Select an unassigned teammate to add to this squad. Their direct reporting line will automatically link to{' '}
            <strong className="text-text-primary">{squadToManageMembers?.manager?.name || 'Squad Lead'}</strong>.
          </p>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Select Teammate
            </label>
            {unassignedMembers.length === 0 ? (
              <div className="py-4 text-center text-xs text-text-muted bg-surface-low rounded-lg border border-border">
                No unassigned teammates available. Onboard new members first or unassign from other squads.
              </div>
            ) : (
              <select
                value={memberToAddId}
                onChange={(e) => setMemberToAddId(e.target.value)}
                className="w-full px-3 py-2 bg-surface-low border border-border rounded-lg text-xs text-text-primary focus:outline-hidden focus:border-brand-emerald"
                required
              >
                <option value="">-- Choose a teammate --</option>
                {unassignedMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({m.email}) — {m.jobTitle || m.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSquadToManageMembers(null)}
            >
              Close
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!memberToAddId || addMembersMutation.isPending}
              className="bg-brand-emerald text-white hover:bg-emerald-600"
            >
              {addMembersMutation.isPending ? 'Assigning...' : 'Assign to Squad'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Disband Squad Confirmation */}
      <Modal
        isOpen={Boolean(teamToDelete)}
        onClose={() => setTeamToDelete(null)}
        title={`Disband Squad: ${teamToDelete?.name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-text-secondary">
            Are you sure you want to disband <strong className="text-text-primary">{teamToDelete?.name}</strong>?
            All members will be unassigned from this squad, but will remain active workspace employees.
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTeamToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDeleteConfirm}
              disabled={deleteTeamMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTeamMutation.isPending ? 'Disbanding...' : 'Disband Squad'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
