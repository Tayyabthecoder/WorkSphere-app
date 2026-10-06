import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium tracking-tight rounded-lg transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus:outline-none select-none';

    const sizeStyles = {
      sm: 'text-xs h-8 px-3 rounded-lg gap-1.5',
      md: 'text-xs h-9 px-4 rounded-lg gap-2',
      lg: 'text-sm h-10 px-5 rounded-lg gap-2',
    };

    const variantStyles = {
      primary:
        'bg-brand-emerald text-white hover:bg-brand-primary shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-brand-emerald/25 border border-emerald-800/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)]',
      secondary:
        'bg-surface-low text-text-primary hover:bg-surface-dim border border-border/80 focus:ring-2 focus:ring-border/40 shadow-2xs',
      outline:
        'bg-surface-card border border-border/80 text-text-primary hover:bg-surface-low hover:border-border focus:ring-2 focus:ring-brand-emerald/20 shadow-2xs',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-low focus:ring-1 focus:ring-border',
      danger:
        'bg-status-error text-white hover:bg-red-700 focus:ring-2 focus:ring-status-error/30 shadow-2xs',
      icon: 'p-0 w-8 h-8 rounded-lg bg-surface-card border border-border/80 text-text-secondary hover:text-text-primary hover:bg-surface-low focus:ring-1 focus:ring-brand-emerald/20 shadow-2xs',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            baseStyles,
            variant === 'icon' ? variantStyles.icon : [sizeStyles[size], variantStyles[variant]],
            className
          )
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
