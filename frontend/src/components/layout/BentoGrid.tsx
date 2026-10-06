import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-5 w-full',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface BentoColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;
  children: React.ReactNode;
}

export const BentoCol: React.FC<BentoColProps> = ({ span = 4, className, children, ...props }) => {
  const spanStyles = {
    3: 'col-span-1 md:col-span-2 lg:col-span-3',
    4: 'col-span-1 md:col-span-2 lg:col-span-4',
    5: 'col-span-1 md:col-span-3 lg:col-span-5',
    6: 'col-span-1 md:col-span-4 lg:col-span-6',
    7: 'col-span-1 md:col-span-4 lg:col-span-7',
    8: 'col-span-1 md:col-span-4 lg:col-span-8',
    9: 'col-span-1 md:col-span-4 lg:col-span-9',
    12: 'col-span-1 md:col-span-4 lg:col-span-12',
  };

  return (
    <div className={twMerge(clsx(spanStyles[span], 'flex flex-col gap-5', className))} {...props}>
      {children}
    </div>
  );
};

export default BentoGrid;
