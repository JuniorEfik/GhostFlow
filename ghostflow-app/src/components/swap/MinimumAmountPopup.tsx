'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface MinimumAmountPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount?: number;
}

export function MinimumAmountPopup({
  isOpen,
  onClose,
  currentAmount = 0,
}: MinimumAmountPopupProps) {
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="min-amount-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popup card */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-amber-500/30 shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Amber accent bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600" />

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center animate-[bounceSoft_0.6s_ease-out]">
              <svg
                className="w-7 h-7 text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <h2
            id="min-amount-title"
            className="text-xl font-bold text-white text-center mb-2"
          >
            Minimum amount required
          </h2>
          <p className="text-white/70 text-center text-sm mb-6">
            Swaps and sends require at least <span className="font-semibold text-amber-400">10 USDC</span>.
            {currentAmount > 0 && (
              <span className="block mt-2">
                Your amount: <span className="text-white/90">{currentAmount.toLocaleString()} USDC</span>
              </span>
            )}
          </p>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
