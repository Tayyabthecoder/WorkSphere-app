import React, { useState } from 'react';
import { Mail, RefreshCw, XCircle, Clock, Send, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/ToastContext';
import { useInvitations, useResendInvitation, useRevokeInvitation } from '../../../hooks/useTeam';
import { useAuthStore } from '../../../store/auth';
import { canManageRole } from '../../../lib/rbac';
import { Invitation } from '../../../types';

export const PendingInvitationsTable: React.FC = () => {
  const { toast } = useToast();
  const { data: invitations = [], isLoading, refetch } = useInvitations();
  const resendMutation = useResendInvitation();
  const revokeMutation = useRevokeInvitation();

  const currentUser = useAuthStore((state) => state.user);
  const [operatingId, setOperatingId] = useState<string | null>(null);

  const handleResend = async (inv: Invitation) => {
    if (!canManageRole(currentUser?.role, inv.role)) {
      toast.error('You do not have permission to manage this invitation');
      return;
    }
    try {
      setOperatingId(inv.invitationId);
      await resendMutation.mutateAsync(inv.invitationId);
      toast.success(`Invitation resent to ${inv.email}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to resend invitation');
    } finally {
      setOperatingId(null);
    }
  };

  const handleRevoke = async (inv: Invitation) => {
    if (!canManageRole(currentUser?.role, inv.role)) {
      toast.error('You do not have permission to revoke this invitation');
      return;
    }
    try {
      setOperatingId(inv.invitationId);
      await revokeMutation.mutateAsync(inv.invitationId);
      toast.success(`Invitation for ${inv.email} revoked`);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to revoke invitation');
    } finally {
      setOperatingId(null);
    }
  };

  const calculateDaysRemaining = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-border/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-text-primary">Pending Workspace Invitations</h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Invitations sent to prospective team members awaiting account setup.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border/80 bg-surface-low/50 text-[11px] font-mono uppercase tracking-wider text-text-muted">
              <th className="py-3 px-4">Invited Recipient</th>
              <th className="py-3 px-3">Role Tier</th>
              <th className="py-3 px-3">Department</th>
              <th className="py-3 px-3">Invitation Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-muted">
                  Loading pending invitations...
                </td>
              </tr>
            ) : invitations.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8 text-brand-emerald/40" />
                    <span className="font-medium text-text-secondary">No pending invitations</span>
                    <span className="text-[11px] text-text-muted">
                      All invited members have already accepted and joined your workspace.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              invitations.map((inv) => {
                const daysRemaining = calculateDaysRemaining(inv.expiresAt);
                const isExpired = daysRemaining <= 0;
                const isBusy = operatingId === inv.invitationId;

                return (
                  <tr key={inv.invitationId} className="hover:bg-surface-low/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-emerald/10 text-brand-emerald flex items-center justify-center font-bold text-xs shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="font-semibold text-text-primary">{inv.name}</span>
                          <span className="text-[11px] text-text-muted truncate">{inv.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="capitalize font-medium text-text-secondary">{inv.role}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-text-muted">{inv.department || 'Engineering'}</span>
                    </td>
                    <td className="py-3 px-3">
                      {isExpired ? (
                        <Badge variant="neutral" size="sm" dot>
                          Expired
                        </Badge>
                      ) : (
                        <Badge variant="progress" size="sm" dot>
                          Expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {canManageRole(currentUser?.role, inv.role) ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleResend(inv)}
                            leftIcon={<Send className="w-3 h-3 text-brand-emerald" />}
                          >
                            Resend
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => handleRevoke(inv)}
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            leftIcon={<XCircle className="w-3 h-3" />}
                          >
                            Revoke
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted font-mono italic">
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default PendingInvitationsTable;
