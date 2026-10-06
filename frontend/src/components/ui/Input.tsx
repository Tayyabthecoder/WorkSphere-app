import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Search } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isSearch?: boolean;
  shortcutBadge?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      isSearch = false,
      shortcutBadge,
      leftIcon,
      type = 'text',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    if (isSearch) {
      return (
        <div className="relative flex items-center w-full">
          <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
            {leftIcon || <Search className="w-3.5 h-3.5" />}
          </div>
          <input
            ref={ref}
            type="search"
            id={inputId}
            className={twMerge(
              clsx(
                'w-full h-9 pl-9 pr-10 rounded-lg bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle',
                error && 'border-status-error focus:ring-status-error/15',
                className
              )
            )}
            {...props}
          />
          {shortcutBadge && (
            <div className="absolute right-2.5">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-text-muted bg-surface-low border border-border rounded shadow-xs pointer-events-none">
                {shortcutBadge}
              </kbd>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-text-primary tracking-tight">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-text-muted pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full h-9 px-3 rounded-lg bg-surface-card border border-border text-xs text-text-primary placeholder:text-text-muted transition-all focus:outline-none focus:border-brand-emerald focus:ring-2 focus:ring-brand-emerald/15 shadow-subtle',
                leftIcon && 'pl-9',
                error && 'border-status-error focus:ring-status-error/15',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <span className="text-[11px] text-status-error font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
