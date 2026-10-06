import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  Users,
  Settings,
  Plus,
  Zap,
  CalendarDays,
  GanttChart,
  Activity,
  Building2,
  ShieldAlert,
  ArrowRight,
  CornerDownLeft,
  X,
} from 'lucide-react';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTask?: () => void;
}

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Projects' | 'Tasks';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  badge?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewTask,
}) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isSuperAdmin = user?.role === 'superAdmin';

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [liveTasks, setLiveTasks] = useState<Array<{ taskId: string; title: string; projectId: string }>>([]);
  const [liveProjects, setLiveProjects] = useState<Array<{ projectId: string; name: string }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch dynamic search items
      Promise.all([
        apiClient.get('/v1/projects').then((r) => r.data).catch(() => null),
        apiClient.get('/v1/tasks?limit=50').then((r) => r.data).catch(() => null),
      ])
        .then(([projData, taskData]) => {
          if (projData?.data) {
            setLiveProjects(
              projData.data.slice(0, 8).map((p: any) => ({
                projectId: p.projectId,
                name: p.name,
              }))
            );
          }
          if (taskData?.data) {
            setLiveTasks(
              taskData.data.slice(0, 10).map((t: any) => ({
                taskId: t.taskId,
                title: t.title,
                projectId: t.projectId,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Static Navigation items
  const navigationItems: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Executive Dashboard',
        subtitle: 'Main KPI overview, Dark Wave timer, and deliverables',
        icon: LayoutDashboard,
        action: () => {
          navigate('/dashboard');
          onClose();
        },
      },
      {
        id: 'nav-projects',
        category: 'Navigation',
        title: 'Project Portfolio',
        subtitle: 'Active initiatives, budgets, and milestones',
        icon: FolderKanban,
        action: () => {
          navigate('/projects');
          onClose();
        },
      },
      {
        id: 'nav-sprints',
        category: 'Navigation',
        title: 'Sprints & Agile',
        subtitle: 'Sprint boards, burndown charts, and backlog planning',
        icon: Zap,
        action: () => {
          navigate('/sprints');
          onClose();
        },
      },
      {
        id: 'nav-tasks',
        category: 'Navigation',
        title: 'Deliverables & Work Items',
        subtitle: 'Cross-project task list, Kanban, and detail drawers',
        icon: CheckSquare,
        action: () => {
          navigate('/tasks');
          onClose();
        },
      },
      {
        id: 'nav-calendar',
        category: 'Navigation',
        title: 'Work Schedule & Calendar',
        subtitle: 'Monthly schedule and deliverable deadlines',
        icon: CalendarDays,
        action: () => {
          navigate('/calendar');
          onClose();
        },
      },
      {
        id: 'nav-gantt',
        category: 'Navigation',
        title: 'Gantt Chart & Timeline',
        subtitle: 'Interactive project timelines, dependencies, and zoom',
        icon: GanttChart,
        action: () => {
          navigate('/gantt');
          onClose();
        },
      },
      {
        id: 'nav-timesheet',
        category: 'Navigation',
        title: 'Weekly Timesheet & Billing',
        subtitle: 'Time tracking, duration logs, and billable ratios',
        icon: Clock,
        action: () => {
          navigate('/timesheet');
          onClose();
        },
      },
      {
        id: 'nav-budget',
        category: 'Navigation',
        title: 'Budget, Cost & Expenses',
        subtitle: 'Expenditures, receipts, burn-down, and currency sync',
        icon: DollarSign,
        action: () => {
          navigate('/budget');
          onClose();
        },
      },
      {
        id: 'nav-reports',
        category: 'Navigation',
        title: 'Analytics & Executive Reports',
        subtitle: 'Velocity, resource allocation, and audit exports',
        icon: BarChart3,
        action: () => {
          navigate('/reports');
          onClose();
        },
      },
      {
        id: 'nav-documents',
        category: 'Navigation',
        title: 'Document & Knowledge Base',
        subtitle: 'TipTap rich-text documents and asset repository',
        icon: FileText,
        action: () => {
          navigate('/documents');
          onClose();
        },
      },
      {
        id: 'nav-team',
        category: 'Navigation',
        title: 'Team Directory & Access Control',
        subtitle: 'Workforce roster, invitations, and RBAC roles',
        icon: Users,
        action: () => {
          navigate('/team');
          onClose();
        },
      },
      {
        id: 'nav-capacity',
        category: 'Navigation',
        title: 'Resource Capacity Planning',
        subtitle: 'Team workload allocations and bandwidth heatmaps',
        icon: Activity,
        action: () => {
          navigate('/capacity');
          onClose();
        },
      },
      {
        id: 'nav-clients',
        category: 'Navigation',
        title: 'Clients & CRM Directory',
        subtitle: 'Client portfolio, contacts, and client portal links',
        icon: Building2,
        action: () => {
          navigate('/clients');
          onClose();
        },
      },
      {
        id: 'nav-settings',
        category: 'Navigation',
        title: 'Organization Settings',
        subtitle: 'General preferences, security, and tenant configurations',
        icon: Settings,
        action: () => {
          navigate('/settings');
          onClose();
        },
      },
    ];

    if (isSuperAdmin) {
      items.push({
        id: 'nav-admin',
        category: 'Navigation',
        title: 'Super Admin Fleet Hub',
        subtitle: 'Tenant management, audit explorer, and system telemetry',
        icon: ShieldAlert,
        badge: 'Fleet',
        action: () => {
          navigate('/admin');
          onClose();
        },
      });
    }

    return items;
  }, [navigate, onClose, isSuperAdmin]);

  // Static Action items
  const actionItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'act-new-task',
        category: 'Actions',
        title: 'Create New Task Deliverable',
        subtitle: 'Add a new work item with priority, assignee, and dates',
        icon: Plus,
        badge: 'Quick Action',
        action: () => {
          onClose();
          onOpenNewTask?.();
        },
      },
      {
        id: 'act-new-project',
        category: 'Actions',
        title: 'Initiate New Project',
        subtitle: 'Create a new project workspace with methodology choice',
        icon: FolderKanban,
        badge: 'Quick Action',
        action: () => {
          navigate('/projects');
          onClose();
        },
      },
      {
        id: 'act-log-time',
        category: 'Actions',
        title: 'Record Timesheet Duration',
        subtitle: 'Manually register hours logged against active deliverable',
        icon: Clock,
        action: () => {
          navigate('/timesheet');
          onClose();
        },
      },
      {
        id: 'act-log-expense',
        category: 'Actions',
        title: 'Log Project Expense',
        subtitle: 'Submit cost item with receipts and budget category',
        icon: DollarSign,
        action: () => {
          navigate('/budget');
          onClose();
        },
      },
    ],
    [navigate, onClose, onOpenNewTask]
  );

  // Dynamic Project items
  const projectItems: CommandItem[] = useMemo(
    () =>
      liveProjects.map((p) => ({
        id: `proj-${p.projectId}`,
        category: 'Projects' as const,
        title: p.name,
        subtitle: `Project Workspace #${p.projectId}`,
        icon: FolderKanban,
        badge: 'Project',
        action: () => {
          navigate(`/projects/${p.projectId}`);
          onClose();
        },
      })),
    [liveProjects, navigate, onClose]
  );

  // Dynamic Task items
  const taskItems: CommandItem[] = useMemo(
    () =>
      liveTasks.map((t) => ({
        id: `task-${t.taskId}`,
        category: 'Tasks' as const,
        title: t.title,
        subtitle: `Deliverable #${t.taskId} in project ${t.projectId}`,
        icon: CheckSquare,
        badge: 'Task',
        action: () => {
          navigate('/tasks');
          onClose();
        },
      })),
    [liveTasks, navigate, onClose]
  );

  // Filtered and combined items
  const filteredItems = useMemo(() => {
    const all = [...actionItems, ...navigationItems, ...projectItems, ...taskItems];
    if (!query.trim()) return all;

    const lower = query.toLowerCase().trim();
    return all.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower)) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [actionItems, navigationItems, projectItems, taskItems, query]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Group filtered items by category
  const categories = ['Actions', 'Navigation', 'Projects', 'Tasks'] as const;
  let runningIndex = 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-brand-evergreen/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Palette Container */}
      <div
        className="w-full max-w-2xl bg-surface-card rounded-2xl border border-border/90 shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in zoom-in-95 duration-150 text-text-primary"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-border/80 gap-3 bg-surface-card">
          <Search className="w-5 h-5 text-brand-emerald shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search projects, tasks, or jump to view..."
            className="flex-1 bg-transparent border-none text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded text-text-muted hover:text-text-primary"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-text-muted bg-surface-low border border-border/80 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 divide-y divide-border/40">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <Search className="w-8 h-8 text-text-muted/40 mb-2" />
              <p className="text-sm font-semibold text-text-primary">No results found</p>
              <p className="text-xs text-text-muted mt-0.5">
                No matching actions, views, or deliverables found for &ldquo;{query}&rdquo;
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const itemsInCategory = filteredItems.filter((item) => item.category === category);
              if (itemsInCategory.length === 0) return null;

              return (
                <div key={category} className="py-1.5 first:pt-0 last:pb-0">
                  <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-text-muted uppercase">
                    {category}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {itemsInCategory.map((item) => {
                      const itemIdx = runningIndex++;
                      const isSelected = itemIdx === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.id}
                          data-active={isSelected}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(itemIdx)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-brand-emerald text-white'
                              : 'text-text-primary hover:bg-surface-low'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-surface-low text-brand-emerald border border-border/60'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col min-w-0 truncate">
                              <span className="font-semibold truncate">{item.title}</span>
                              {item.subtitle && (
                                <span
                                  className={`text-[11px] truncate ${
                                    isSelected ? 'text-emerald-100' : 'text-text-secondary'
                                  }`}
                                >
                                  {item.subtitle}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {item.badge && (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isSelected
                                    ? 'bg-white/20 text-white'
                                    : 'bg-surface-low text-brand-emerald border border-border/80'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                            {isSelected ? (
                              <CornerDownLeft className="w-3.5 h-3.5 text-white animate-pulse" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5 text-text-muted/60" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Helper */}
        <div className="px-4 py-2.5 bg-surface-low/60 border-t border-border/80 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-card border border-border/80 rounded font-mono text-[9px] shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-surface-card border border-border/80 rounded font-mono text-[9px] shadow-2xs">
                ↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface-card border border-border/80 rounded font-mono text-[9px] shadow-2xs">
                ↵
              </kbd>
              Execute
            </span>
          </div>
          <span className="font-mono text-[10px]">WorkSphere Universal Command</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
