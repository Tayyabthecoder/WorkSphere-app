import React, { useState, useEffect } from 'react';
import {
  Info,
  AlertTriangle,
  Wrench,
  Sparkles,
  X,
} from 'lucide-react';
import apiClient from '../../api/client';

export type AnnouncementType = 'info' | 'warning' | 'maintenance' | 'feature';

interface ActiveAnnouncement {
  announcementId: string;
  type: AnnouncementType;
  title: string;
  message: string;
}

export const AnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<ActiveAnnouncement | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        const res = await apiClient.get('/v1/announcements');
        const json = res.data;
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const dismissedRaw = sessionStorage.getItem('dismissed_announcements') || '[]';
          let dismissedIds: string[] = [];
          try {
            dismissedIds = JSON.parse(dismissedRaw);
          } catch {
            dismissedIds = [];
          }

          // Find the first announcement not yet dismissed this session
          const active = json.data.find(
            (a: ActiveAnnouncement) => !dismissedIds.includes(a.announcementId)
          );

          if (active) {
            setAnnouncement(active);
          }
        }
      } catch {
        // Silently catch fetch errors for banner
      }
    };

    fetchActive();
  }, []);

  if (!announcement || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      const dismissedRaw = sessionStorage.getItem('dismissed_announcements') || '[]';
      const dismissedIds: string[] = JSON.parse(dismissedRaw);
      if (!dismissedIds.includes(announcement.announcementId)) {
        dismissedIds.push(announcement.announcementId);
        sessionStorage.setItem('dismissed_announcements', JSON.stringify(dismissedIds));
      }
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const styleMap: Record<
    AnnouncementType,
    { bg: string; border: string; text: string; icon: React.ElementType; accent: string }
  > = {
    info: {
      bg: 'bg-blue-50/95 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800/60',
      text: 'text-blue-900 dark:text-blue-100',
      accent: 'text-blue-600 dark:text-blue-400',
      icon: Info,
    },
    warning: {
      bg: 'bg-amber-50/95 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-900 dark:text-amber-100',
      accent: 'text-amber-600 dark:text-amber-400',
      icon: AlertTriangle,
    },
    maintenance: {
      bg: 'bg-rose-50/95 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800/60',
      text: 'text-rose-900 dark:text-rose-100',
      accent: 'text-rose-600 dark:text-rose-400',
      icon: Wrench,
    },
    feature: {
      bg: 'bg-emerald-50/95 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      text: 'text-emerald-900 dark:text-emerald-100',
      accent: 'text-emerald-600 dark:text-emerald-400',
      icon: Sparkles,
    },
  };

  const currentStyle = styleMap[announcement.type] || styleMap.info;
  const IconComponent = currentStyle.icon;

  return (
    <div
      role="region"
      aria-label="Workspace Announcement"
      className={`w-full border-b px-4 py-2.5 transition-all duration-200 ${currentStyle.bg} ${currentStyle.border}`}
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <IconComponent className={`w-4 h-4 shrink-0 ${currentStyle.accent}`} />
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold tracking-tight ${currentStyle.text}`}>
              {announcement.title}:
            </span>
            <span className={`${currentStyle.text} opacity-90 truncate max-w-2xl`}>
              {announcement.message}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0 ${currentStyle.accent}`}
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
