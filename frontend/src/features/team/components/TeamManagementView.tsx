import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Power,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { useToast } from '../../../components/ui/ToastContext';
import { useAuthStore } from '../../../store/auth';
import { InviteMemberModal } from './InviteMemberModal';
import apiClient from '../../../api/client';

export const TeamManagementView: React.FC = () => {
  const { toast } = useToast();
  const currentUser = useAuthStore((state) => state.user);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/team');
      if (res.data?.success) {
        setMembers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.department) set.add(m.department);
    });
    return ['ALL', ...Array.from(set)];
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedDept !== 'ALL' && m.department !== selectedDept) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q) ||
          m.role?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, selectedDept, searchQuery]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/v1/team/${userId}`, { role: newRole });
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
      toast.success('Role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (userId === currentUser?.userId) {
      toast.warning('Cannot deactivate own account');
      return;
    }
    try {
      await apiClient.patch(`/v1/team/${userId}`, { isActive: !currentStatus });
      setMembers((prev) =>
        prev.map((m) =>
          m.userId === userId ? { ...m, isActive: !currentStatus } : m
        )
      );
      toast.success(currentStatus ? 'Member deactivated' : 'Member activated');
    } catch {
      toast.error('Failed to update member status');
    }
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
            Manage organization members, departments, and access tier assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchTeam}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={() => setIsInviteModalOpen(true)}
          >
            Invite Member
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            />
          </div>

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
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-3">Role Tier</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    Loading team directory...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    No team members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.userId} className="hover:bg-surface-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.name}
                          src={member.avatarUrl}
                          size="sm"
                          isOnline={member.isActive}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">
                            {member.name}
                            {member.userId === currentUser?.userId && (
                              <span className="ml-1.5 text-[10px] font-mono text-brand-emerald font-normal">
                                (You)
                              </span>
                            )}
                          </span>
                          <span className="text-text-secondary text-[11px]">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={member.role}
                        disabled={member.userId === currentUser?.userId}
                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                        className="h-8 px-2 rounded-lg text-xs font-medium bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald disabled:opacity-60 cursor-pointer"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="orgAdmin">Org Admin</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-text-secondary font-medium">
                        {member.department || 'General'}
                      </span>
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
                    <td className="py-3 px-4 text-right">
                      {member.userId !== currentUser?.userId && (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(member.userId, member.isActive)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            member.isActive
                              ? 'text-text-muted hover:text-rose-600 hover:bg-rose-50'
                              : 'text-text-muted hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={member.isActive ? 'Deactivate member' : 'Reactivate member'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Standalone Invite Member Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvited={fetchTeam}
      />
    </div>
  );
};

export default TeamManagementView;
