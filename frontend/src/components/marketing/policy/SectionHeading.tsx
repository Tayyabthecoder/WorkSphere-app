import React from 'react';

interface SectionHeadingProps {
  number: number | string;
  children: React.ReactNode;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  number,
  children,
  className = '',
}) => {
  return (
    <h2
      className={`text-xl sm:text-2xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-3 ${className}`}
    >
      <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-extrabold flex items-center justify-center shrink-0">
        {number}
      </span>
      <span>{children}</span>
    </h2>
  );
};

export default SectionHeading;
