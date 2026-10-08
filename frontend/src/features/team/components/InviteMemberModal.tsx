import React, { useState } from 'react';
import { UserPlus, Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/ToastContext';
import { useInviteMember } from '../../../hooks/useTeam';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited?: () => void;
  existingDepartments?: string[];
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvited,
  existingDepartments = [],
}) => {
  const { toast } = useToast();
  const inviteMutation = useInviteMember();

  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteDept, setInviteDept] = useState('Engineering');
  const [customDept, setCustomDept] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const defaultDepts = ['Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Executive'];
  const allDepartments = Array.from(new Set([...defaultDepts, ...existingDepartments.filter((d) => d && d !== 'ALL')]));

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Name and email are required');
      return;
    }

    const resolvedDept = inviteDept === 'custom' ? customDept.trim() || 'General' : inviteDept;

    try {
      setInviteError('');
      const res = await inviteMutation.mutateAsync({
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        department: resolvedDept,
      });

      toast.success(`Invitation dispatched to ${inviteEmail}`);
      if (res?.acceptLink) {
        setCreatedInviteLink(res.acceptLink);
      } else {
        resetForm();
        onInvited?.();
        onClose();
      }
    } catch (err: any) {
      setInviteError(
        err.response?.data?.error?.message || err.message || 'Failed to dispatch invitation'
      );
    }
  };

  const resetForm = () => {
    setInviteName('');
    setInviteEmail('');
    setInviteRole('member');
    setInviteDept('Engineering');
    setCustomDept('');
    setCreatedInviteLink(null);
    setInviteError('');
  };

  const handleCopyLink = () => {
    if (createdInviteLink) {
      navigator.clipboard.writeText(createdInviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success('Invitation link copied to clipboard');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Invite Team Member"
      description="Send a secure invitation to onboard a new collaborator to this workspace."
      icon={<UserPlus className="w-4 h-4 text-brand-emerald" />}
      maxWidth="md"
    >
      {createdInviteLink ? (
        <div className="flex flex-col gap-4 py-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
            <span className="font-semibold block mb-0.5">Invitation link generated!</span>
            An invitation email has been dispatched. You can also share the direct setup link below:
          </div>

          <div className="flex items-center gap-2">
            <Input value={createdInviteLink} readOnly className="text-xs font-mono select-all" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="flex justify-end pt-3 border-t border-border/80">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetForm();
                onInvited?.();
                onClose();
              }}
            >
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 py-2 text-xs">
          {inviteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {inviteError}
            </div>
          )}

          <div>
            <label className="font-semibold text-text-primary block mb-1">Full Name</label>
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-text-primary block mb-1">Email Address</label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="jane@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-text-primary block mb-1">Role Permission</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
              >
                <option value="member">Member (Standard Access)</option>
                <option value="manager">Manager (Squad & Projects)</option>
                <option value="orgAdmin">Org Admin (Full Settings)</option>
                <option value="viewer">Viewer (Read Only)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">Department</label>
              <select
                value={inviteDept}
                onChange={(e) => setInviteDept(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
              >
                {allDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
                <option value="custom">+ New Department...</option>
              </select>
            </div>
          </div>

          {inviteDept === 'custom' && (
            <div>
              <label className="font-semibold text-text-primary block mb-1">New Department Name</label>
              <Input
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="e.g. Data Science"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={inviteMutation.isPending}
              leftIcon={
                inviteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined
              }
            >
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default InviteMemberModal;
