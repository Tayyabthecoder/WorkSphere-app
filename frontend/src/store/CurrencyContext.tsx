import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  CurrencyDefinition,
  SUPPORTED_CURRENCIES,
  CURRENCY_MAP,
  formatCurrency as baseFormatCurrency,
  convertCurrency as baseConvertCurrency,
} from '../utils/currency';

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  currencyInfo: CurrencyDefinition;
  supportedCurrencies: CurrencyDefinition[];
  setCurrency: (code: string) => void;
  formatCurrency: (amount: number, overrideCurrency?: string) => string;
  convertCurrency: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = 'worksphere_currency';

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const initializeCurrency = () => {
      try {
        const storedCurrency = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        if (storedCurrency && CURRENCY_MAP[storedCurrency]) {
          if (isMounted) {
            setCurrencyState(storedCurrency);
            setIsLoading(false);
          }
          return;
        }
      } catch (err) {
        console.warn('Could not initialize currency:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeCurrency();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && CURRENCY_MAP[e.newValue]) {
        setCurrencyState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    const upperCode = code.toUpperCase();
    if (CURRENCY_MAP[upperCode]) {
      setCurrencyState(upperCode);
      try {
        localStorage.setItem(STORAGE_KEY, upperCode);
      } catch {
        // Ignore storage error
      }
    }
  }, []);

  const currencyInfo = useMemo(() => {
    return CURRENCY_MAP[currency] || CURRENCY_MAP['USD'];
  }, [currency]);

  const currencySymbol = currencyInfo.symbol;

  const format = useCallback(
    (amount: number, overrideCurrency?: string) => {
      return baseFormatCurrency(amount, overrideCurrency || currency);
    },
    [currency]
  );

  const convert = useCallback(
    (amount: number, fromCurrency: string = 'USD', toCurrency?: string) => {
      return baseConvertCurrency(amount, fromCurrency, toCurrency || currency);
    },
    [currency]
  );

  const value = useMemo(
    () => ({
      currency,
      currencySymbol,
      currencyInfo,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      setCurrency,
      formatCurrency: format,
      convertCurrency: convert,
      isLoading,
    }),
    [currency, currencySymbol, currencyInfo, setCurrency, format, convert, isLoading]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    const fallbackCurrency = 'USD';
    const fallbackInfo = CURRENCY_MAP['USD'];
    return {
      currency: fallbackCurrency,
      currencySymbol: '$',
      currencyInfo: fallbackInfo,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      setCurrency: () => {},
      formatCurrency: (amount: number, override?: string) =>
        baseFormatCurrency(amount, override || fallbackCurrency),
      convertCurrency: (amount: number, from = 'USD', to = fallbackCurrency) =>
        baseConvertCurrency(amount, from, to),
      isLoading: false,
    };
  }
  return context;
}
