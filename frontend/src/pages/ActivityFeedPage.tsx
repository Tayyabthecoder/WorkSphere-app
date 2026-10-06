import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  CheckSquare,
  FolderKanban,
  Zap,
  FileText,
  MessageSquare,
  Clock,
  RefreshCw,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Radio,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ActivityHeatmap } from '../components/dashboard/ActivityHeatmap';
import { useSocket } from '../context/SocketContext';
import apiClient from '../api/client';

export interface ActivityLogItem {
  logId: string;
  tenantId: string;
  projectId?: string | null;
  projectName?: string | null;
  userId: string;
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  action: string;
  entityType: 'project' | 'task' | 'sprint' | 'document' | 'timeEntry' | 'expense' | 'member' | 'comment';
  entityId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

const ENTITY_TABS = [
  { key: 'all', label: 'All Activities', icon: Activity },
  { key: 'task', label: 'Tasks', icon: CheckSquare },
  { key: 'project', label: 'Projects', icon: FolderKanban },
  { key: 'sprint', label: 'Sprints', icon: Zap },
  { key: 'document', label: 'Documents', icon: FileText },
  { key: 'comment', label: 'Comments', icon: MessageSquare },
  { key: 'timeEntry', label: 'Timesheets', icon: Clock },
] as const;

export const ActivityFeedPage: React.FC = () => {
  const { socket, isConnected } = useSocket();

  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());

  // Fetch activities from backend
  const fetchActivities = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (targetPage === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        const params: Record<string, any> = {
          page: targetPage,
          limit: 25,
        };
        if (activeTab !== 'all') {
          params.entityType = activeTab;
        }

        const res = await apiClient.get('/v1/activity', { params });
        if (res.data?.success && res.data.data) {
          const { logs, pagination } = res.data.data;
          setActivities((prev) => (append ? [...prev, ...logs] : logs));
          setPage(pagination.page);
          setTotalPages(pagination.totalPages);
          setTotalCount(pagination.total);
        }
      } catch (err) {
        console.error('Failed to load activity feed:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchActivities(1, false);
  }, [fetchActivities]);

  // Real-time socket listener for incoming events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewActivity = (newLog: ActivityLogItem) => {
      // Check if matches active tab filter
      if (activeTab !== 'all' && newLog.entityType !== activeTab) return;

      setActivities((prev) => [newLog, ...prev]);
      setTotalCount((c) => c + 1);

      // Flash highlight animation for 3 seconds
      setNewActivityIds((prev) => new Set(prev).add(newLog.logId));
      setTimeout(() => {
        setNewActivityIds((prev) => {
          const next = new Set(prev);
          next.delete(newLog.logId);
          return next;
        });
      }, 3000);
    };

    socket.on('activity:new', handleNewActivity);

    return () => {
      socket.off('activity:new', handleNewActivity);
    };
  }, [socket, isConnected, activeTab]);

  // Load next page
  const handleLoadMore = () => {
    if (page < totalPages && !isLoadingMore) {
      fetchActivities(page + 1, true);
    }
  };

  // Filter activities by client-side search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;
    const q = searchQuery.toLowerCase();
    return activities.filter((act) => {
      const userName = act.user?.name?.toLowerCase() || '';
      const action = act.action.toLowerCase();
      const projName = act.projectName?.toLowerCase() || '';
      const metadataStr = JSON.stringify(act.metadata || {}).toLowerCase();
      return (
        userName.includes(q) ||
        action.includes(q) ||
        projName.includes(q) ||
        metadataStr.includes(q)
      );
    });
  }, [activities, searchQuery]);

  const heatmapData = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((act) => {
      if (act.createdAt) {
        const date = act.createdAt.split('T')[0];
        map[date] = (map[date] || 0) + 1;
      }
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [activities]);

  // Render Icon & Styling per entity
  const getEntityConfig = (type: string) => {
    switch (type) {
      case 'task':
        return {
          icon: CheckSquare,
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          label: 'Task',
        };
      case 'project':
        return {
          icon: FolderKanban,
          color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          label: 'Project',
        };
      case 'sprint':
        return {
          icon: Zap,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          label: 'Sprint',
        };
      case 'document':
        return {
          icon: FileText,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          label: 'Document',
        };
      case 'comment':
        return {
          icon: MessageSquare,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          label: 'Comment',
        };
      case 'timeEntry':
        return {
          icon: Clock,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          label: 'Timesheet',
        };
      default:
        return {
          icon: Activity,
          color: 'text-text-muted bg-surface-low border-border/80',
          label: 'Activity',
        };
    }
  };

  // Human-readable action description
  const formatAction = (act: ActivityLogItem) => {
    const title = act.metadata?.taskTitle || act.metadata?.title || act.metadata?.name;
    const oldStatus = act.metadata?.oldStatus;
    const newStatus = act.metadata?.newStatus || act.metadata?.status;

    switch (act.action) {
      case 'created_task':
        return (
          <span>
            created task <strong className="text-text-primary">{title || act.entityId}</strong>
          </span>
        );
      case 'updated_task':
      case 'changed_status':
        return (
          <span>
            updated status of <strong className="text-text-primary">{title || 'task'}</strong>
            {oldStatus && newStatus ? (
              <span className="text-text-muted">
                {' '}
                from <span className="font-semibold text-text-secondary">{oldStatus}</span> &rarr;{' '}
                <span className="font-semibold text-brand-emerald">{newStatus}</span>
              </span>
            ) : (
              <span> to {newStatus}</span>
            )}
          </span>
        );
      case 'created_comment':
        return (
          <span>
            commented on <strong className="text-text-primary">{title || 'task'}</strong>
          </span>
        );
      case 'created_project':
        return (
          <span>
            created project <strong className="text-text-primary">{title || act.entityId}</strong>
          </span>
        );
      case 'created_sprint':
        return (
          <span>
            started sprint <strong className="text-text-primary">{title || act.entityId}</strong>
          </span>
        );
      case 'logged_time':
        return (
          <span>
            logged {act.metadata?.duration ? `${act.metadata.duration}m` : 'time'} on{' '}
            <strong className="text-text-primary">{title || 'task'}</strong>
          </span>
        );
      case 'submitted_timesheet':
        return <span>submitted timesheet for manager review</span>;
      case 'approved_timesheet':
        return <span>approved timesheet entry</span>;
      case 'rejected_timesheet':
        return <span>requested adjustments on timesheet</span>;
      default:
        return (
          <span>
            performed <span className="font-mono text-text-primary">{act.action}</span>
          </span>
        );
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full p-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Activity Feed
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-emerald/10 text-brand-emerald border border-brand-emerald/20">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-emerald"></span>
              </span>
              <span>Live Stream</span>
            </div>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Real-time feed of member actions, project milestones, task state changes, and discussions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={() => fetchActivities(1, false)}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Fernly Contribution Cadence Heatmap */}
      <ActivityHeatmap
        data={heatmapData}
        weeks={20}
        totalContributions={totalCount || activities.length}
      />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ENTITY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-brand-emerald text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search feed..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-low border border-border text-xs text-text-primary placeholder:text-text-muted outline-none focus:ring-1 focus:ring-brand-emerald"
          />
        </div>
      </div>

      {/* Activities Timeline List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="py-20 text-center text-text-muted text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-brand-emerald" />
            <span>Streaming workspace activity feed...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-surface-card border border-border/80 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-low flex items-center justify-center text-text-muted">
              <Activity className="w-6 h-6" />
            </div>
            <div className="font-semibold text-text-primary text-sm">No activity recorded yet</div>
            <p className="text-xs text-text-secondary max-w-sm">
              Actions taken by team members on tasks, projects, comments, and sprints will stream here live.
            </p>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const config = getEntityConfig(act.entityType);
            const Icon = config.icon;
            const isNew = newActivityIds.has(act.logId);

            return (
              <div
                key={act.logId}
                className={`p-4 rounded-xl bg-surface-card border transition-all duration-300 flex items-start justify-between gap-4 ${
                  isNew
                    ? 'border-brand-emerald bg-brand-emerald/5 ring-1 ring-brand-emerald/30 shadow-md'
                    : 'border-border/80 hover:border-border hover:shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Entity Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${config.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Body Content */}
                  <div className="min-w-0">
                    <div className="text-xs text-text-secondary leading-relaxed">
                      <span className="font-bold text-text-primary hover:underline cursor-pointer">
                        {act.user?.name || 'Workspace Member'}
                      </span>{' '}
                      {formatAction(act)}
                    </div>

                    {/* Metadata Context Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {act.projectName && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-low border border-border/80 text-text-secondary">
                          {act.projectName}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-surface-low text-text-muted">
                        {config.label}
                      </span>
                      {act.metadata?.commentText && (
                        <span className="text-xs text-text-secondary italic line-clamp-1 max-w-md">
                          &ldquo;{act.metadata.commentText}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Timestamp & Link */}
                <div className="flex items-center gap-2 text-right flex-shrink-0">
                  <span className="text-[11px] text-text-muted whitespace-nowrap">
                    {formatRelativeTime(act.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Load More */}
      {!isLoading && page < totalPages && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            leftIcon={
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`} />
            }
          >
            {isLoadingMore ? 'Loading older activity...' : 'Load More Activities'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeedPage;
