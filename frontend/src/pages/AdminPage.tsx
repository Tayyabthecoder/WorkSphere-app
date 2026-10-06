import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '../features/admin/components/AdminSidebar';
import { AdminFleetView } from '../features/admin/components/AdminFleetView';
import { AuditLogExplorerView } from '../features/admin/components/AuditLogExplorerView';
import { AnnouncementsView } from '../features/admin/components/AnnouncementsView';
import { PlatformHealthView } from '../features/admin/components/PlatformHealthView';
import { EmailTemplateManagerView } from '../features/admin/components/EmailTemplateManagerView';
import { RetentionPolicyView } from '../features/admin/components/RetentionPolicyView';
import { SecurityPolicyView } from '../features/admin/components/SecurityPolicyView';

import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export const AdminPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  // Render appropriate view based on route path
  const renderActiveView = () => {
    if (path === '/admin/audit') return <AuditLogExplorerView />;
    if (path === '/admin/announcements') return <AnnouncementsView />;
    if (path === '/admin/health') return <PlatformHealthView />;
    if (path === '/admin/email-templates') return <EmailTemplateManagerView />;
    if (path === '/admin/retention') return <RetentionPolicyView />;
    if (path === '/admin/security') return <SecurityPolicyView />;
    return <AdminFleetView />;
  };

  return (
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
  );
};

export default AdminPage;
