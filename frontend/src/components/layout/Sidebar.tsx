import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  DollarSign,
  BarChart3,
  FileText,
  Users,
  Settings,
  Sparkles,
  LogOut,
  X,
  ShieldAlert,
  Zap,
  CalendarDays,
  GanttChart,
  Activity,
  Building2,
  Radio,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { useAuthStore } from '../../store/auth';
import { UserRole } from '../../lib/rbac';
import apiClient from '../../api/client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  tenantName?: string;
  tenantSlug?: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tenantName = 'Platform',
  tenantSlug = 'platform',
  userName = 'User',
  userRole = 'superAdmin',
  userAvatar,
  onClose,
  className = '',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const activeRole = (user?.role || userRole) as UserRole;

  const rawNavGroups: NavGroup[] = [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Activity Feed', href: '/activity', icon: Radio },
        { label: 'Projects', href: '/projects', icon: FolderKanban },
        { label: 'Sprints', href: '/sprints', icon: Zap },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Calendar', href: '/calendar', icon: CalendarDays },
        { label: 'Gantt', href: '/gantt', icon: GanttChart },
        { label: 'Timesheet', href: '/timesheet', icon: Clock },
        {
          label: 'Automations',
          href: '/automation',
          icon: Sparkles,
          allowedRoles: ['superAdmin', 'orgAdmin', 'managingDirector', 'manager'],
        },
      ],
    },
    {
      title: 'FINANCE & REPORTS',
      items: [
        {
          label: 'Budget & Cost',
          href: '/budget',
          icon: DollarSign,
          allowedRoles: ['superAdmin', 'orgAdmin', 'managingDirector', 'manager'],
        },
        {
          label: 'Analytics',
          href: '/reports',
          icon: BarChart3,
          allowedRoles: ['superAdmin', 'orgAdmin', 'managingDirector', 'manager', 'hr'],
        },
        { label: 'Documents', href: '/documents', icon: FileText },
      ],
    },
    {
      title: 'TEAM & CLIENTS',
      items: [
        { label: 'Team Members', href: '/team', icon: Users },
        {
          label: 'Capacity',
          href: '/capacity',
          icon: Activity,
          allowedRoles: ['superAdmin', 'orgAdmin', 'managingDirector', 'hr', 'manager', 'teamLeader'],
        },
        {
          label: 'Clients',
          href: '/clients',
          icon: Building2,
          allowedRoles: ['superAdmin', 'orgAdmin', 'managingDirector', 'manager'],
        },
      ],
    },
    {
      title: 'ORGANIZATION',
      items: [
        {
          label: 'Settings',
          href: '/settings',
          icon: Settings,
          allowedRoles: ['superAdmin', 'orgAdmin'],
        },
        {
          label: 'Admin Fleet',
          href: '/admin',
          icon: ShieldAlert,
          allowedRoles: ['superAdmin'],
        },
      ],
    },
  ];

  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.allowedRoles) return true;
        return item.allowedRoles.includes(activeRole);
      }),
    }))
    .filter((group) => group.items.length > 0);

  const handleSignOut = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <aside className={`w-[248px] h-screen bg-surface-card border-r border-border/80 flex flex-col justify-between shrink-0 select-none ${className}`}>
      {/* Top Section */}
      <div className="flex flex-col">
        {/* Brand Logo & Workspace Header */}
        <div className="p-3 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-surface-low transition-colors cursor-pointer group flex-1 mr-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-emerald to-brand-primary flex items-center justify-center text-white shadow-2xs border border-emerald-700/30 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4 text-brand-mint" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-text-primary tracking-tight truncate">
                    {tenantName}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-mint animate-pulse shrink-0" />
                </div>
                <span className="text-[10px] text-text-muted font-mono truncate">
                  {tenantSlug}.worksphere.app
                </span>
              </div>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors md:hidden"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="p-3 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navGroups.map((group) => (
            <div key={group.title} className="flex flex-col gap-1">
              <span className="px-3 text-[10px] font-bold text-text-muted tracking-wider font-mono uppercase">
                {group.title}
              </span>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.label}
                      to={item.href}
                      onClick={() => onClose?.()}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-brand-emerald/10 text-brand-emerald font-semibold shadow-2xs border-l-2 border-brand-emerald'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-brand-emerald' : 'text-text-muted'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile Row */}
      <div className="p-3 border-t border-border/80">
        <div className="flex items-center justify-between p-2 rounded-lg bg-surface-low/80 border border-border/80 hover:bg-surface-low transition-colors">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <Avatar name={userName} src={userAvatar} size="sm" isOnline />
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-text-primary truncate">{userName}</span>
              <span className="text-[10px] text-text-muted font-medium capitalize truncate font-mono">
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded-md text-text-muted hover:text-status-error-text hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
