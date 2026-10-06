import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-surface-dim/70 ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 rounded-xl border border-border/80 bg-surface-card flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-6 rounded-full" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
};

export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 5,
  className = '',
}) => {
  return (
    <tr className={`border-b border-border/60 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-3.5">
          <Skeleton className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonKanbanCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-3.5 rounded-xl border border-border/80 bg-surface-card flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
  );
};

export default Skeleton;
