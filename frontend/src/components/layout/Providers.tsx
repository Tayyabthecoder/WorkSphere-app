import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../ui/ToastContext';
import { CurrencyProvider } from '../../store/CurrencyContext';
import { I18nProvider } from '../../lib/i18n';
import { SocketProvider } from '../../context/SocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <I18nProvider>
          <ToastProvider>
            <SocketProvider>{children}</SocketProvider>
          </ToastProvider>
        </I18nProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
};

export default Providers;
