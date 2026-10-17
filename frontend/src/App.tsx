import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Error Boundary
import ProtectedRoute from './components/layout/ProtectedRoute';
import RoleRouteGuard from './components/layout/RoleRouteGuard';
import PageLoader from './components/ui/PageLoader';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Public Marketing Pages (Lazy Loaded)
const HomePage = lazy(() => import('./pages/marketing/HomePage'));
const ServicesPage = lazy(() => import('./pages/marketing/ServicesPage'));
const AboutPage = lazy(() => import('./pages/marketing/AboutPage'));
const PricingPage = lazy(() => import('./pages/marketing/PricingPage'));
const BlogPage = lazy(() => import('./pages/marketing/BlogPage'));
const ContactPage = lazy(() => import('./pages/marketing/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/marketing/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/marketing/TermsOfServicePage'));
const CookiePolicyPage = lazy(() => import('./pages/marketing/CookiePolicyPage'));

// Public Authentication & Onboarding Pages (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const WorkspaceOnboardingPage = lazy(() => import('./pages/WorkspaceOnboardingPage'));
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage'));

// Protected Pages (Lazy Loaded)
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const SprintsPage = lazy(() => import('./pages/SprintsPage'));
const SprintBoardPage = lazy(() => import('./pages/SprintBoardPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const GanttPage = lazy(() => import('./pages/GanttPage'));
const CapacityPage = lazy(() => import('./pages/CapacityPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const TimesheetPage = lazy(() => import('./pages/TimesheetPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ActivityFeedPage = lazy(() => import('./pages/ActivityFeedPage'));
const AutomationPage = lazy(() => import('./pages/AutomationPage'));

// Project Sub-Views
const ProjectOverviewPanel = lazy(
  () => import('./features/projects/components/ProjectOverviewPanel')
);
const KanbanBoard = lazy(() =>
  import('./features/kanban/KanbanBoard').then((m) => ({ default: m.KanbanBoard }))
);
const ProjectListView = lazy(
  () => import('./features/projects/components/ProjectListView')
);

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="Application Error">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Marketing Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/cookies" element={<CookiePolicyPage />} />
          <Route path="/cookie-policy" element={<CookiePolicyPage />} />

          {/* Public Authentication & Onboarding Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/onboarding" element={<WorkspaceOnboardingPage />} />

          {/* External Tokenized Client Portal Route (No Auth Required) */}
          <Route path="/portal/:portalToken" element={<ClientPortalPage />} />

          {/* Authenticated Workspace Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/activity" element={<ActivityFeedPage />} />
            <Route path="/projects" element={<ProjectsPage />} />

            {/* Nested Project Hub Routes */}
            <Route path="/projects/:projectId" element={<ProjectDetailPage />}>
              <Route index element={<ProjectOverviewPanel />} />
              <Route path="board" element={<KanbanBoard />} />
              <Route path="list" element={<ProjectListView />} />
              <Route path="timeline" element={<GanttPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="backlog" element={<SprintBoardPage />} />
              <Route
                path="capacity"
                element={
                  <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin', 'managingDirector', 'hr', 'manager', 'teamLeader']}>
                    <CapacityPage />
                  </RoleRouteGuard>
                }
              />
            </Route>

            <Route path="/sprints" element={<SprintsPage />} />
            <Route path="/sprints/:projectId" element={<SprintBoardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/gantt" element={<GanttPage />} />
            <Route
              path="/capacity"
              element={
                <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin', 'managingDirector', 'hr', 'manager', 'teamLeader']}>
                  <CapacityPage />
                </RoleRouteGuard>
              }
            />
            <Route
              path="/clients"
              element={
                <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin', 'managingDirector', 'manager']}>
                  <ClientsPage />
                </RoleRouteGuard>
              }
            />
            <Route path="/timesheet" element={<TimesheetPage />} />
            <Route path="/time" element={<Navigate to="/timesheet" replace />} />
            <Route
              path="/budget"
              element={
                <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin', 'managingDirector', 'manager']}>
                  <BudgetPage />
                </RoleRouteGuard>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin', 'managingDirector', 'manager', 'hr']}>
                  <ReportsPage />
                </RoleRouteGuard>
              }
            />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route
              path="/automation"
              element={
                <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin', 'managingDirector', 'manager']}>
                  <AutomationPage />
                </RoleRouteGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <RoleRouteGuard allowedRoles={['superAdmin', 'orgAdmin']}>
                  <SettingsPage />
                </RoleRouteGuard>
              }
            />

            {/* Admin Hub Routes */}
            <Route element={<RoleRouteGuard allowedRoles={['superAdmin']} />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/audit" element={<AdminPage />} />
              <Route path="/admin/security" element={<AdminPage />} />
              <Route path="/admin/retention" element={<AdminPage />} />
              <Route path="/admin/announcements" element={<AdminPage />} />
              <Route path="/admin/health" element={<AdminPage />} />
              <Route path="/admin/email-templates" element={<AdminPage />} />
            </Route>
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default App;
