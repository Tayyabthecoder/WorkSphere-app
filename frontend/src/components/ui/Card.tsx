import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'emerald' | 'flat' | 'glass';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-surface-card rounded-xl border border-border/80 shadow-card hover:shadow-card-hover transition-all duration-150',
      dark: 'bg-brand-evergreen text-white rounded-xl shadow-glow-dark relative overflow-hidden border border-emerald-950/60 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]',
      emerald:
        'bg-brand-emerald text-white rounded-xl shadow-glow-emerald relative overflow-hidden border border-emerald-800/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]',
      flat: 'bg-surface-low rounded-xl border border-border/80 transition-colors duration-150',
      glass: 'bg-white/85 backdrop-blur-md rounded-xl border border-white/60 shadow-card',
    };

    return (
      <div ref={ref} className={twMerge(clsx(variantStyles[variant], 'p-5', className))} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
