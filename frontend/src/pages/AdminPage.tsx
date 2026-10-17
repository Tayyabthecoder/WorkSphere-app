import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { AdminSidebar } from '../features/admin/components/AdminSidebar';
import { AdminFleetView } from '../features/admin/components/AdminFleetView';
import { TenantDetailView } from '../features/admin/components/TenantDetailView';
import { AnalyticsDashboardView } from '../features/admin/components/AnalyticsDashboardView';
import { UserLookupView } from '../features/admin/components/UserLookupView';
import { SystemConfigView } from '../features/admin/components/SystemConfigView';
import { SuperAdminRosterView } from '../features/admin/components/SuperAdminRosterView';
import { AuditLogExplorerView } from '../features/admin/components/AuditLogExplorerView';
import { AnnouncementsView } from '../features/admin/components/AnnouncementsView';
import { PlatformHealthView } from '../features/admin/components/PlatformHealthView';
import { EmailTemplateManagerView } from '../features/admin/components/EmailTemplateManagerView';
import { RetentionPolicyView } from '../features/admin/components/RetentionPolicyView';
import { SecurityPolicyView } from '../features/admin/components/SecurityPolicyView';
import { AdminCommandBar } from '../features/admin/components/AdminCommandBar';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export const AdminPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global Cmd+K or Ctrl+K shortcut for platform-wide admin search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Render appropriate view based on route path
  const renderActiveView = () => {
    if (path.startsWith('/admin/tenants/')) return <TenantDetailView />;
    if (path === '/admin/analytics') return <AnalyticsDashboardView />;
    if (path === '/admin/users') return <UserLookupView />;
    if (path === '/admin/config') return <SystemConfigView />;
    if (path === '/admin/roster') return <SuperAdminRosterView />;
    if (path === '/admin/audit') return <AuditLogExplorerView />;
    if (path === '/admin/announcements') return <AnnouncementsView />;
    if (path === '/admin/health') return <PlatformHealthView />;
    if (path === '/admin/email-templates') return <EmailTemplateManagerView />;
    if (path === '/admin/retention') return <RetentionPolicyView />;
    if (path === '/admin/security') return <SecurityPolicyView />;
    return <AdminFleetView />;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Platform Quick Search Strip */}
      <div className="flex items-center justify-between p-2.5 px-4 rounded-xl bg-surface-card border border-border/80 text-xs">
        <div className="flex items-center gap-2 text-text-muted">
          <span className="font-semibold text-text-primary">Super Admin Command Center</span>
          <span>&bull;</span>
          <span>Cross-fleet operational controls &amp; system health</span>
        </div>

        <button
          type="button"
          onClick={() => setIsCommandOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-low hover:bg-surface-high border border-border/80 text-text-secondary hover:text-text-primary transition-colors cursor-pointer text-xs"
        >
          <Search className="w-3.5 h-3.5 text-brand-emerald" />
          <span>Global Search (Tenants, Users, Initiatives)</span>
          <kbd className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-card border border-border/80 text-text-muted ml-1">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Admin Sidebar Navigation */}
        <AdminSidebar />

        {/* Main Admin Section View */}
        <div className="flex-1 min-w-0 w-full">
          <ErrorBoundary fallbackTitle="Admin Section Error">
            {renderActiveView()}
          </ErrorBoundary>
        </div>
      </div>

      {/* Global Command Bar */}
      <AdminCommandBar isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </div>
  );
};

export default AdminPage;
