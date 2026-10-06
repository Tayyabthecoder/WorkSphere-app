import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';
import AnnouncementBanner from './AnnouncementBanner';
import ImpersonationBanner from './ImpersonationBanner';
import ShortcutsModal from '../common/ShortcutsModal';
import CreateTaskModal from '../../features/tasks/components/CreateTaskModal';
import { useAuthStore } from '../../store/auth';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  onNewTaskClick?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  onNewTaskClick,
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Extract projectId from path if inside /projects/:projectId or /sprints/:projectId
  const projectMatch = location.pathname.match(/\/(?:projects|sprints)\/([a-zA-Z0-9_-]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : undefined;

  const handleOpenNewTask = () => {
    if (onNewTaskClick) {
      onNewTaskClick();
    } else {
      setIsCreateTaskOpen(true);
    }
  };

  const handleOpenNewTaskRef = React.useRef(handleOpenNewTask);
  useEffect(() => {
    handleOpenNewTaskRef.current = handleOpenNewTask;
  });

  // Auto-close mobile navigation drawer on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Global Keybindings Listener (Cmd+K, ?, C, G -> [D, P, T, S, C, O])
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      const isInputActive =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      // Cmd+K or Ctrl+K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }

      // If typing in an input, do not trigger single-key global shortcuts
      if (isInputActive) return;

      // Question mark -> Shortcuts Guide Modal
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // Quick "G" sequential navigation
      const now = Date.now();
      const upperKey = e.key.toUpperCase();

      // Standalone 'C' -> Create new deliverable / task (matches Shortcuts guide)
      if (upperKey === 'C' && lastKey !== 'G' && !(e.ctrlKey || e.metaKey || e.altKey)) {
        e.preventDefault();
        handleOpenNewTaskRef.current();
        return;
      }

      if (upperKey === 'G') {
        lastKey = 'G';
        lastKeyTime = now;
        return;
      }

      if (lastKey === 'G' && now - lastKeyTime < 1000) {
        lastKey = '';
        if (upperKey === 'D') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (upperKey === 'P') {
          e.preventDefault();
          navigate('/projects');
        } else if (upperKey === 'T') {
          e.preventDefault();
          navigate('/tasks');
        } else if (upperKey === 'S') {
          e.preventDefault();
          navigate('/sprints');
        } else if (upperKey === 'C') {
          e.preventDefault();
          navigate('/timesheet');
        } else if (upperKey === 'O') {
          e.preventDefault();
          navigate('/settings');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Derive human title from pathname if not explicitly passed
  const getDerivedTitle = () => {
    if (title) return title;
    const path = location.pathname.replace('/', '');
    if (!path || path === 'dashboard') return 'Executive Command Center';
    if (path === 'projects') return 'Project Portfolio';
    if (path.startsWith('projects/')) return 'Project Workspace';
    if (path === 'sprints') return 'Sprints & Agile Lifecycle';
    if (path.startsWith('sprints/')) return 'Active Sprint Board';
    if (path === 'tasks') return 'My Work & Deliverables';
    if (path === 'calendar') return 'Work Schedule & Calendar';
    if (path === 'gantt') return 'Gantt Chart & Timeline';
    if (path === 'timesheet') return 'Weekly Timesheet & Billing';
    if (path === 'budget') return 'Budget, Cost & Expenses';
    if (path === 'reports') return 'Executive Analytics & Performance';
    if (path === 'documents') return 'Document & Asset Repository';
    if (path === 'team') return 'Team Members & Access Control';
    if (path === 'capacity') return 'Team Capacity & Allocation';
    if (path === 'clients') return 'Client Directory & CRM';
    if (path === 'settings') return 'Organization Settings';
    if (path === 'admin' || path.startsWith('admin/')) return 'Super Admin Platform Fleet';
    return 'WorkSphere Workspace';
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-canvas text-text-primary">
      {/* Skip to Main Content Link for A11y */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-emerald focus:text-white focus:rounded-md shadow-lg"
      >
        Skip to main content
      </a>

      {/* Impersonation Warning Banner */}
      <ImpersonationBanner />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop Sidebar Rail */}
        <div className="hidden md:flex shrink-0">
          <Sidebar
            tenantName={user?.tenantId?.replace('tnt_', '').toUpperCase() || 'NOVATECH'}
            tenantSlug={user?.tenantId?.replace('tnt_', '') || 'novatech'}
            userName={user?.name || 'Workspace User'}
            userRole={user?.role || 'member'}
            userAvatar={user?.avatarUrl}
          />
        </div>

        {/* Mobile Slide-Over Navigation */}
        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-brand-evergreen/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileNavOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-surface-card shadow-2xl z-10">
              <Sidebar
                tenantName={user?.tenantId?.replace('tnt_', '').toUpperCase() || 'NOVATECH'}
                tenantSlug={user?.tenantId?.replace('tnt_', '') || 'novatech'}
                userName={user?.name || 'Workspace User'}
                userRole={user?.role || 'member'}
                userAvatar={user?.avatarUrl}
                onClose={() => setIsMobileNavOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <Header
            title={getDerivedTitle()}
            onMenuClick={() => setIsMobileNavOpen(true)}
            onNewTaskClick={handleOpenNewTask}
            onSearchClick={() => setIsCommandOpen(true)}
            onShortcutsClick={() => setIsShortcutsOpen(true)}
          />

          {/* Announcement Banner */}
          <AnnouncementBanner />

          <main id="main-content" className="flex-1 overflow-y-auto bg-surface-canvas p-3 sm:p-5 lg:p-7">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Universal Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onOpenNewTask={handleOpenNewTask}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Global Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        defaultProjectId={currentProjectId}
      />
    </div>
  );
};

export default AppShell;
