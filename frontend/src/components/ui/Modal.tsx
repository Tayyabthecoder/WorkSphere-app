'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  maxWidth = 'xl',
  className = '',
  closeOnOutsideClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    // Lock body scroll when modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const maxWidthClass = maxWidthMap[maxWidth] || 'max-w-xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`bg-surface-card rounded-xl w-full p-5 sm:p-6 border border-border/80 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150 ${maxWidthClass} ${className}`}
      >
        {/* Header */}
        {(title || icon || description) && (
          <div className="flex items-start justify-between pb-3.5 border-b border-border/80 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-brand-emerald flex items-center justify-center text-white shadow-2xs shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight truncate">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-text-secondary mt-0.5 truncate sm:whitespace-normal">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-low transition-colors shrink-0 ml-2"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Optional Footer Actions */}
        {footer && (
          <div className="pt-3.5 border-t border-border/80 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
