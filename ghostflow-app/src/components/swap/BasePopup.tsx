'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface BasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  accentColor?: 'amber' | 'gray' | 'red';
  zIndex?: number;
  closeOnBackdrop?: boolean;
  closeOnCardClick?: boolean;
  children: React.ReactNode;
}

const ACCENT_STYLES = {
  amber: 'bg-gradient-to-r from-amber-400 to-amber-600',
  gray: 'bg-gray-300 dark:bg-gray-600',
  red: 'bg-gradient-to-r from-red-500 to-red-600',
};

const BORDER_STYLES = {
  amber: 'border border-gray-200 dark:border-amber-500/30',
  gray: 'border border-gray-200 dark:border-white/20',
  red: 'border border-gray-200 dark:border-red-500/30',
};

export function BasePopup({
  isOpen,
  onClose,
  titleId,
  accentColor = 'amber',
  zIndex = 100,
  closeOnBackdrop = true,
  closeOnCardClick = false,
  children,
}: BasePopupProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleBackdropClick = closeOnBackdrop ? onClose : undefined;
  const handleCardClick = closeOnCardClick ? onClose : (e: React.MouseEvent) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        aria-hidden="true"
      />
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-white dark:bg-[#1a1a1a] border ${BORDER_STYLES[accentColor]} shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out] ${closeOnCardClick ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <div className={`h-1 ${ACCENT_STYLES[accentColor]}`} />
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
