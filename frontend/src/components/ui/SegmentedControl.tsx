import React from 'react';

export interface SegmentedOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  className = '',
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-surface-low border border-border/80 shadow-2xs ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`flex items-center gap-1.5 rounded-lg font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs'
            } ${
              isSelected
                ? 'bg-surface-card text-brand-emerald shadow-xs border border-border/60'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-card/50 border border-transparent'
            }`}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected
                    ? 'bg-brand-emerald/10 text-brand-emerald'
                    : 'bg-surface-dim text-text-muted'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
