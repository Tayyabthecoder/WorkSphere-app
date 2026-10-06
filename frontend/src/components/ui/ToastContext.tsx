import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastItem, ToastType } from './Toast';

interface ToastOptions {
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toast: {
    success: (title: string, options?: ToastOptions) => void;
    error: (title: string, options?: ToastOptions) => void;
    info: (title: string, options?: ToastOptions) => void;
    warning: (title: string, options?: ToastOptions) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, options?: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        id,
        type,
        title,
        message: options?.message,
        action: options?.action,
      };

      setToasts((prev) => [...prev, newToast]);

      const duration = options?.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (title: string, options?: ToastOptions) => addToast('success', title, options),
    error: (title: string, options?: ToastOptions) => addToast('error', title, options),
    info: (title: string, options?: ToastOptions) => addToast('info', title, options),
    warning: (title: string, options?: ToastOptions) => addToast('warning', title, options),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => (
          <Toast key={item.id} toast={item} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
