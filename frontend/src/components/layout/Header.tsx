import React from 'react';
import { Plus, Search, Menu, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { NotificationPopover } from './NotificationPopover';
import { CurrencyDropdown } from './CurrencyDropdown';

interface HeaderProps {
  title?: string;
  onNewTaskClick?: () => void;
  onSearchClick?: () => void;
  onShortcutsClick?: () => void;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Executive Dashboard',
  onNewTaskClick,
  onSearchClick,
  onShortcutsClick,
  onMenuClick,
}) => {
  return (
    <header className="h-[56px] bg-surface-card border-b border-border/80 px-3 sm:px-6 flex items-center justify-between shrink-0 select-none z-10 gap-2">
      {/* Title / Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-low transition-colors md:hidden shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-sm sm:text-base font-bold text-text-primary tracking-tight truncate">{title}</h1>
      </div>

      {/* Center Search / Command Palette Trigger (Desktop) */}
      <div className="w-[340px] hidden md:block">
        <button
          type="button"
          onClick={onSearchClick}
          className="relative flex items-center w-full h-9 pl-9 pr-12 rounded-lg bg-surface-low border border-border/80 text-xs text-text-muted hover:border-brand-emerald/40 hover:bg-surface-card focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald transition-all text-left cursor-pointer shadow-subtle"
        >
          <Search className="w-3.5 h-3.5 text-text-muted absolute left-3 pointer-events-none" />
          <span className="truncate">Search or type ⌘K...</span>
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-text-muted bg-surface-card border border-border/80 rounded shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onSearchClick}
          className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-low transition-colors md:hidden"
          aria-label="Search or run command"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Multi-Currency Symbol Selector Dropdown */}
        <CurrencyDropdown />

        {/* Real-Time Notification Bell Popover */}
        <NotificationPopover />

        {/* Keyboard Shortcuts Trigger Button */}
        {onShortcutsClick && (
          <button
            type="button"
            onClick={onShortcutsClick}
            className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors hidden sm:flex items-center justify-center cursor-pointer"
            aria-label="Keyboard Shortcuts"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={onNewTaskClick}
          className="shadow-subtle hover:shadow-card font-semibold text-xs px-2.5 sm:px-3"
        >
          <span className="hidden sm:inline">Add Task</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
