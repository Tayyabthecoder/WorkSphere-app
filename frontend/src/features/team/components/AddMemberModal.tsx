import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../components/ui/ToastContext';
import { useAddMember } from '../../../hooks/useTeam';
import { useTeams } from '../../../hooks/useTeams';
import { useAuthStore } from '../../../store/auth';
import { getAssignableRoles } from '../../../lib/rbac';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded?: () => void;
  existingDepartments?: string[];
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  onMemberAdded,
  existingDepartments = [],
}) => {
  const { toast } = useToast();
  const addMemberMutation = useAddMember();
  const currentUser = useAuthStore((state) => state.user);
  const { data: teams = [] } = useTeams();

  const assignableRoles = useMemo(() => {
    return getAssignableRoles(currentUser?.role, true);
  }, [currentUser?.role]);

  const selectableTeams = useMemo(() => {
    if (currentUser?.role === 'manager') {
      return teams.filter((t) => t.managerId === currentUser.userId);
    }
    return teams;
  }, [teams, currentUser]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(assignableRoles[0]?.value || 'member');
  const [department, setDepartment] = useState('Engineering');
  const [customDept, setCustomDept] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Synchronize default role whenever assignableRoles updates or modal opens
  useEffect(() => {
    if (assignableRoles.length > 0 && !assignableRoles.some((r) => r.value === role)) {
      setRole(assignableRoles[0].value);
    }
  }, [assignableRoles, role]);

  // Success summary state (shows credentials for admin handover)
  const [createdSummary, setCreatedSummary] = useState<{
    name: string;
    email: string;
    role: string;
    department: string;
    initialPassword?: string;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  const defaultDepts = ['Engineering', 'Design', 'Product', 'Marketing', 'Operations', 'Executive'];
  const allDepartments = Array.from(
    new Set([...defaultDepts, ...existingDepartments.filter((d) => d && d !== 'ALL')])
  );

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'WS';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generated += '1!';
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }

    const isRoleAllowed = assignableRoles.some((r) => r.value === role);
    if (!isRoleAllowed) {
      setError(`Your role '${currentUser?.role}' cannot assign the role '${role}'`);
      return;
    }

    const resolvedDept = department === 'custom' ? customDept.trim() || 'General' : department;
    const resolvedPassword = password.trim() || undefined;

    try {
      setError('');
      const res = await addMemberMutation.mutateAsync({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: resolvedDept,
        jobTitle: jobTitle.trim() || undefined,
        teamId: teamId || null,
        password: resolvedPassword,
      });

      toast.success(`${name} has been added to the workspace`);
      setCreatedSummary({
        name: res.name || name,
        email: res.email || email,
        role: res.role || role,
        department: res.department || resolvedDept,
        initialPassword: res.initialPassword || resolvedPassword,
      });
      onMemberAdded?.();
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to add team member'
      );
    }
  };

  const handleCopyCredentials = () => {
    if (createdSummary) {
      const text = `WorkSphere Workspace Login Credentials:\nEmail: ${createdSummary.email}\nPassword: ${createdSummary.initialPassword || '(Not specified)'}\nRole: ${createdSummary.role}`;
      navigator.clipboard.writeText(text);
      setCopiedCredentials(true);
      setTimeout(() => setCopiedCredentials(false), 2000);
      toast.success('Credentials copied to clipboard');
    }
  };

  const handleResetAndClose = () => {
    setName('');
    setEmail('');
    setRole(assignableRoles[0]?.value || 'member');
    setDepartment('Engineering');
    setCustomDept('');
    setJobTitle('');
    setTeamId('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setCreatedSummary(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Add Team Member"
      description="Directly create and onboard a new team member with immediate workspace access."
      icon={<UserPlus className="w-4 h-4 text-brand-emerald" />}
      maxWidth="md"
    >
      {createdSummary ? (
        <div className="flex flex-col gap-4 py-2 text-xs">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-start gap-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Member Added Successfully!</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                <strong>{createdSummary.name}</strong> is now an active member of this workspace. Share the credentials below with them to log in.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-surface-low rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-text-muted">Account Email</span>
              <span className="font-mono font-semibold text-text-primary">{createdSummary.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-text-muted">Assigned Role</span>
              <span className="capitalize font-semibold text-text-primary">{createdSummary.role}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/60">
              <span className="text-text-muted">Department</span>
              <span className="font-medium text-text-primary">{createdSummary.department}</span>
            </div>

            {createdSummary.initialPassword && (
              <div className="flex items-center justify-between py-1">
                <span className="text-text-muted">Initial Password</span>
                <span className="font-mono font-bold text-brand-emerald bg-brand-emerald/10 px-2 py-0.5 rounded select-all">
                  {createdSummary.initialPassword}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            {createdSummary.initialPassword && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCredentials}
                leftIcon={copiedCredentials ? <Check className="w-3.5 h-3.5 text-brand-emerald" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedCredentials ? 'Copied' : 'Copy Credentials'}
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleResetAndClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="font-semibold text-text-primary block mb-1">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-text-primary block mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-text-primary block mb-1">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald cursor-pointer"
              >
                {assignableRoles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} ({r.description})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-text-primary block mb-1">Job Title / Designation</label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">Assigned Delivery Squad</label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald cursor-pointer"
              >
                <option value="">(Unassigned / General Roster)</option>
                {selectableTeams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.name} (Lead: {t.manager?.name || 'Manager'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {department === 'custom' && (
            <div>
              <label className="font-semibold text-text-primary block mb-1">New Department Name</label>
              <Input
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="e.g. Customer Success"
                required
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-text-primary">Initial Password</label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] text-brand-emerald hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <Sparkles className="w-3 h-3" /> Auto-generate
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to auto-generate a secure password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-muted mt-1">
              Minimum 8 characters. If left blank, a random password will be created for you to share.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
            <Button variant="secondary" size="sm" type="button" onClick={handleResetAndClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={addMemberMutation.isPending}
              leftIcon={
                addMemberMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />
              }
            >
              Add Member
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AddMemberModal;
