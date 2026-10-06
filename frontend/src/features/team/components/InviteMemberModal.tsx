import React, { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/ToastContext';
import apiClient from '../../../api/client';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvited: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvited,
}) => {
  const { toast } = useToast();
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteDept, setInviteDept] = useState('Engineering');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError('Name and email are required');
      return;
    }

    try {
      setIsInviting(true);
      setInviteError('');
      const res = await apiClient.post('/v1/team/invite', {
        name: inviteName.trim(),
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        department: inviteDept,
      });

      if (res.data?.success) {
        toast.success(`Invitation dispatched to ${inviteEmail}`);
        setInviteName('');
        setInviteEmail('');
        setInviteRole('member');
        onInvited();
        onClose();
      }
    } catch (err: any) {
      setInviteError(
        err.response?.data?.error?.message || 'Failed to dispatch invitation'
      );
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Send an invitation link to onboard a new collaborator to the workspace."
      icon={<UserPlus className="w-4 h-4 text-brand-emerald" />}
      maxWidth="md"
    >
      <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4 py-2">
        {inviteError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {inviteError}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1">
            Full Name
          </label>
          <Input
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1">
            Email Address
          </label>
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
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Role Permission
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            >
              <option value="member">Member (Work & Delivery)</option>
              <option value="manager">Manager (Projects & Team)</option>
              <option value="orgAdmin">Org Admin (Full Settings)</option>
              <option value="viewer">Viewer (Read Only)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Department
            </label>
            <select
              value={inviteDept}
              onChange={(e) => setInviteDept(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            >
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Executive">Executive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isInviting}
            leftIcon={isInviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InviteMemberModal;
