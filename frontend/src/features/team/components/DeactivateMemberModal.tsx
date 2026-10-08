import React, { useState } from 'react';
import { AlertTriangle, Loader2, ArrowRight, UserX, Check } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { TeamMember } from '../../../types';
import { useDeactivateMember } from '../../../hooks/useTeam';
import { useToast } from '../../../components/ui/ToastContext';

interface DeactivateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  activeMembers: TeamMember[];
  onSuccess: () => void;
}

export const DeactivateMemberModal: React.FC<DeactivateMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  activeMembers,
  onSuccess,
}) => {
  const { toast } = useToast();
  const deactivateMutation = useDeactivateMember();

  const [reassignOption, setReassignOption] = useState<'reassign' | 'unassign'>('reassign');
  const [reassignToUserId, setReassignToUserId] = useState<string>('');

  if (!member) return null;

  const candidateReplacements = activeMembers.filter((m) => m.userId !== member.userId && m.isActive);
  const hasActiveTasks = (member.activeTasks || 0) > 0;

  const handleConfirm = async () => {
    try {
      const targetReplacement =
        hasActiveTasks && reassignOption === 'reassign' ? reassignToUserId : undefined;

      if (hasActiveTasks && reassignOption === 'reassign' && !reassignToUserId) {
        toast.warning('Please select a team member to take over open tasks');
        return;
      }

      await deactivateMutation.mutateAsync({
        userId: member.userId,
        reassignToUserId: targetReplacement,
      });

      toast.success(`${member.name} has been deactivated`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to deactivate member');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deactivate Team Member"
      description={`Are you sure you want to deactivate ${member.name}?`}
      icon={<UserX className="w-4 h-4 text-rose-600" />}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4 py-2 text-xs">
        {/* Warning callout */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5 text-amber-800 dark:text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold">Access will be revoked immediately</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              {member.name} will be logged out and cannot log in. Their historical comments, time entries, and activity logs remain preserved.
            </span>
          </div>
        </div>

        {/* Task Handover section */}
        {hasActiveTasks ? (
          <div className="flex flex-col gap-2 p-3 bg-surface-low rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">
                Active Deliverables ({member.activeTasks} open task{member.activeTasks === 1 ? '' : 's'})
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Choose how you would like to handle unresolved tasks currently assigned to {member.name}:
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="taskAction"
                  checked={reassignOption === 'reassign'}
                  onChange={() => setReassignOption('reassign')}
                  className="mt-0.5 text-brand-emerald focus:ring-brand-emerald"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">Reassign to another teammate</span>
                  <span className="text-[11px] text-text-muted">
                    Transfer all open tasks seamlessly to an active collaborator
                  </span>
                </div>
              </label>

              {reassignOption === 'reassign' && (
                <div className="ml-6 mt-1">
                  <select
                    value={reassignToUserId}
                    onChange={(e) => setReassignToUserId(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg text-xs bg-surface-card border border-border text-text-primary focus:outline-none focus:border-brand-emerald"
                  >
                    <option value="">Select a replacement...</option>
                    {candidateReplacements.map((cand) => (
                      <option key={cand.userId} value={cand.userId}>
                        {cand.name} ({cand.department || 'General'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                <input
                  type="radio"
                  name="taskAction"
                  checked={reassignOption === 'unassign'}
                  onChange={() => setReassignOption('unassign')}
                  className="mt-0.5 text-brand-emerald focus:ring-brand-emerald"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-text-primary">Leave tasks unassigned</span>
                  <span className="text-[11px] text-text-muted">
                    Tasks remain open for any teammate to claim from the backlog
                  </span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>This member has no active tasks to hand over.</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={deactivateMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            disabled={deactivateMutation.isPending}
            leftIcon={deactivateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
          >
            Deactivate Member
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeactivateMemberModal;
