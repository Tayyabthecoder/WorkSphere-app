import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle2, Wrench, X, Megaphone } from 'lucide-react';
import { useAnnouncements } from '../../../hooks/useAnnouncements';
import { Announcement } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

export const AnnouncementsPanel: React.FC = () => {
  const { data: announcements = [] } = useAnnouncements();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dismissed_announcements');
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleDismiss = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem('dismissed_announcements', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissedIds.includes(a.announcementId)
  );

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {visibleAnnouncements.map((ann) => {
        const typeConfig = {
          warning: {
            bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
            icon: AlertTriangle,
            badge: 'warning',
          },
          maintenance: {
            bg: 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200',
            icon: Wrench,
            badge: 'error',
          },
          feature: {
            bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
            icon: CheckCircle2,
            badge: 'success',
          },
          info: {
            bg: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
            icon: Info,
            badge: 'info',
          },
        }[ann.type] || {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
          icon: Info,
          badge: 'info',
        };

        const Icon = typeConfig.icon;

        return (
          <div
            key={ann.announcementId}
            className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-2xs ${typeConfig.bg}`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-1 rounded-md bg-white/60 dark:bg-black/20 shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-text-primary text-xs">{ann.title}</h4>
                  <Badge variant={typeConfig.badge as any} size="sm">
                    {ann.type}
                  </Badge>
                </div>
                {/* Message rendering (HTML or plain text) */}
                <div
                  className="text-text-secondary leading-relaxed line-clamp-2 text-[11px] prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: ann.message }}
                />
              </div>
            </div>

            <button
              onClick={() => handleDismiss(ann.announcementId)}
              className="p-1 text-text-muted hover:text-text-primary rounded transition-colors shrink-0"
              title="Dismiss announcement"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementsPanel;
