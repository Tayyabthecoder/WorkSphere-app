import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  RefreshCw,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wrench,
  Sparkles,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import apiClient from '../../../api/client';

export const AnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/v1/announcements');
      if (res.data?.success) {
        setAnnouncements(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this announcement broadcast?')) return;
    try {
      await apiClient.delete(`/v1/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4 text-rose-500" />;
      case 'feature':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-brand-emerald" />
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Workspace Broadcasts & Announcements
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage global and tenant-specific notification banners displayed across the user shell.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={fetchAnnouncements}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
          >
            New Broadcast
          </Button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-muted">
            Loading active broadcasts...
          </div>
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center flex flex-col items-center justify-center">
            <Megaphone className="w-8 h-8 text-text-muted/40 mb-2" />
            <h3 className="text-sm font-bold text-text-primary">No Active Broadcasts</h3>
            <p className="text-xs text-text-muted mt-1 mb-4">
              Create an announcement to notify workspace users of updates, downtime, or releases.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
              Broadcast First Notice
            </Button>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.announcementId} className="p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-surface-low border border-border/80 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(a.type)}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xs font-bold text-text-primary truncate">{a.title}</h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold bg-surface-low text-text-secondary border border-border/80">
                      {a.type}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Audience: {a.targetAudience || 'all'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">{a.message}</p>
                  <span className="text-[10px] font-mono text-text-muted mt-2">
                    Published: {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDelete(a.announcementId)}
                className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                title="Remove announcement"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))
        )}
      </div>

      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchAnnouncements}
      />
    </div>
  );
};

export default AnnouncementsView;
