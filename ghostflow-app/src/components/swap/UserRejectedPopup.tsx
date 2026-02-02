'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface UserRejectedPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEOUT_MS = 10000;

export function UserRejectedPopup({ isOpen, onClose }: UserRejectedPopupProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    timeoutRef.current = setTimeout(() => {
      onClose();
    }, TIMEOUT_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
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
      aria-labelledby="rejected-title"
      onClick={handleClose}
    >
      {/* Backdrop - clicking closes */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        aria-hidden="true"
      />

      {/* Popup card - clickable to close */}
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#1a1a1a] border border-white/20 shadow-2xl overflow-hidden animate-[scaleIn_0.3s_ease-out] cursor-pointer"
        onClick={handleClose}
      >
        <div className="p-6">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-white/70"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          <h2
            id="rejected-title"
            className="text-xl font-bold text-white text-center mb-2"
          >
            Transaction cancelled
          </h2>
          <p className="text-white/70 text-center text-sm mb-6">
            You rejected the request in your wallet. Click anywhere or wait 10 seconds to close.
          </p>

          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
