import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface CalendarToolbarProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: 'month' | 'week' | 'agenda';
  onChangeViewMode: (mode: 'month' | 'week' | 'agenda') => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  currentDate,
  onPrev,
  onNext,
  onToday,
  viewMode,
  onChangeViewMode,
}) => {
  const monthYearString = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-card border border-border rounded-xl shadow-2xs">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday} className="text-xs h-8">
          Today
        </Button>
        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-surface-low">
          <button
            onClick={onPrev}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-card transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-sm font-bold text-text-primary ml-2 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-emerald" />
          {monthYearString}
        </h2>
      </div>

      {/* View Mode */}
      <div className="flex items-center gap-1 border border-border rounded-lg p-1 bg-surface-low self-start sm:self-auto">
        {(['month', 'week', 'agenda'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChangeViewMode(mode)}
            className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
              viewMode === mode
                ? 'bg-surface-card text-brand-emerald font-semibold shadow-2xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CalendarToolbar;
