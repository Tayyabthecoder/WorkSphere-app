import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Building2,
  Activity,
  Megaphone,
  HeartPulse,
  Mail,
  Shield,
  Lock,
  Trash2,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: 'Fleet Overview',
    href: '/admin',
    icon: Building2,
    exact: true,
  },
  {
    name: 'Audit Log Explorer',
    href: '/admin/audit',
    icon: Activity,
  },
  {
    name: 'Security Policy',
    href: '/admin/security',
    icon: Lock,
  },
  {
    name: 'Retention Policy',
    href: '/admin/retention',
    icon: Trash2,
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
  },
  {
    name: 'Platform Health',
    href: '/admin/health',
    icon: HeartPulse,
  },
  {
    name: 'Email Templates',
    href: '/admin/email-templates',
    icon: Mail,
  },
];

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border/80 bg-surface-card flex flex-col shrink-0 min-h-[calc(100vh-8rem)] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border/80">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-text-muted px-3 mb-1">
          Governance & Fleet
        </div>
        <div className="text-xs text-text-secondary px-3">
          Platform-level operational controls
        </div>
      </div>

      <nav className="p-3 flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.exact}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-emerald text-white shadow-sm font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-low'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-text-muted'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-low text-text-muted border border-border/80'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/80 bg-surface-low/30">
        <div className="flex items-center gap-2 text-[11px] text-text-muted">
          <Shield className="w-3.5 h-3.5 text-brand-emerald" />
          <span>Access Restricted: SuperAdmin</span>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
