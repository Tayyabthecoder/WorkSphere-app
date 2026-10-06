import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading page view"
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-3 border-brand-emerald/20 border-t-brand-emerald animate-spin" />
        <div className="w-2.5 h-2.5 rounded-full bg-brand-mint absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-semibold text-text-primary tracking-tight">
          Loading WorkSphere Workspace...
        </span>
        <span className="text-[11px] font-mono text-text-muted">
          Synchronizing state and real-time streams
        </span>
      </div>
    </div>
  );
};

export default PageLoader;
