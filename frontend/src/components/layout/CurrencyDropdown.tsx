import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, Globe } from 'lucide-react';
import { useCurrency } from '../../store/CurrencyContext';

export const CurrencyDropdown: React.FC = () => {
  const { currency, currencySymbol, currencyInfo, supportedCurrencies, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredCurrencies = useMemo(() => {
    if (!searchQuery.trim()) return supportedCurrencies;
    const query = searchQuery.toLowerCase().trim();
    return supportedCurrencies.filter(
      (c) =>
        c.code.toLowerCase().includes(query) ||
        c.name.toLowerCase().includes(query) ||
        c.symbol.toLowerCase().includes(query)
    );
  }, [supportedCurrencies, searchQuery]);

  const handleSelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-surface-low hover:bg-surface-card border border-border/80 text-xs font-medium text-text-primary transition-all duration-150 hover:border-brand-emerald/40 focus:outline-none focus:ring-1 focus:ring-brand-emerald shadow-2xs cursor-pointer select-none"
        title={`Current Currency: ${currencyInfo.name} (${currencySymbol})`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="font-bold text-brand-emerald font-mono text-xs">{currencySymbol}</span>
        <span className="font-mono text-[11px] font-semibold text-text-secondary">{currency}</span>
        <ChevronDown
          className={`w-3 h-3 text-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-emerald' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-surface-card border border-border/80 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col animate-fade-in">
          <div className="p-2.5 border-b border-border/80 bg-surface-low/50">
            <div className="flex items-center justify-between pb-2 px-1">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-brand-emerald" />
                Select Currency
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                Active: <strong className="text-text-primary font-bold">{currencySymbol} {currency}</strong>
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, code, name..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-surface-card border border-border/80 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald transition-all"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1 divide-y divide-border/40" role="listbox">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((c) => {
                const isSelected = c.code === currency;
                return (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(c.code)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-brand-emerald/10 text-brand-emerald font-semibold'
                        : 'text-text-primary hover:bg-surface-low'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                          isSelected
                            ? 'bg-brand-emerald text-white border-brand-emerald'
                            : 'bg-surface-low text-text-primary border-border/80'
                        }`}
                      >
                        {c.symbol}
                      </span>

                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs">{c.code}</span>
                          <span className="text-[11px] text-text-secondary truncate">
                            {c.name}
                          </span>
                        </div>
                        {c.rate !== 1 && (
                          <span className="text-[10px] text-text-muted font-mono">
                            1 USD ≈ {c.rate.toLocaleString()} {c.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-emerald shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-text-muted">
                No matching currencies found
              </div>
            )}
          </div>

          <div className="px-3 py-2 bg-surface-low/30 border-t border-border/60 text-[10px] text-text-muted flex items-center justify-between">
            <span>Rates updated dynamically</span>
            <span className="font-mono text-brand-emerald">WorkSphere Multi-Currency</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyDropdown;
