import React, { useState } from 'react';
import { Megaphone, Loader2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import apiClient from '../../../api/client';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'maintenance' | 'feature'>('info');
  const [targetAudience, setTargetAudience] = useState<'all' | 'specific_tenants'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Title and message are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await apiClient.post('/v1/announcements', {
        title: title.trim(),
        message: message.trim(),
        type,
        targetAudience,
      });

      setTitle('');
      setMessage('');
      setType('info');
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to broadcast announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broadcast Announcement"
      description="Publish an executive notice across the workspace"
      icon={<Megaphone className="w-4 h-4 text-brand-emerald" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1.5">
            Notice Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['info', 'warning', 'maintenance', 'feature'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 px-2.5 rounded-lg text-xs font-semibold capitalize border transition-all cursor-pointer ${
                  type === t
                    ? 'bg-brand-emerald text-white border-brand-emerald shadow-2xs'
                    : 'bg-surface-low border-border/80 text-text-secondary hover:bg-surface-card'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1.5">
            Announcement Headline
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled Infrastructure Maintenance"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1.5">
            Message Body
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Provide context, expected downtime, or release notes..."
            className="w-full p-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1.5">
            Audience Scope
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value as any)}
            className="w-full h-9 px-3 rounded-lg text-xs bg-surface-low border border-border/80 text-text-primary focus:outline-none focus:border-brand-emerald"
          >
            <option value="all">Global (All Workspace Users)</option>
            <option value="specific_tenants">Current Tenant Only</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/80">
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSubmitting}
            leftIcon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
          >
            Broadcast Now
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAnnouncementModal;
