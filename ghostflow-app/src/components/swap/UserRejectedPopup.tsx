'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BasePopup } from './BasePopup';

interface UserRejectedPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEOUT_SEC = 10;

export function UserRejectedPopup({ isOpen, onClose }: UserRejectedPopupProps) {
  const timeoutRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState(TIMEOUT_SEC);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(TIMEOUT_SEC);
    timeoutRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (timeoutRef.current) {
            clearInterval(timeoutRef.current);
            timeoutRef.current = null;
          }
          setTimeout(() => onClose(), 0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
      timeoutRef.current = null;
    }
    onClose();
  };

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={handleClose}
      titleId="rejected-title"
      accentColor="gray"
      closeOnBackdrop
      closeOnCardClick
    >
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-gray-600 dark:text-white/70"
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
        className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2"
      >
        Transaction cancelled
      </h2>
      <p className="text-gray-600 dark:text-white/70 text-center text-sm mb-6">
        You rejected the request in your wallet. Click anywhere or wait {countdown} second{countdown !== 1 ? 's' : ''} to close.
      </p>
      <button
        onClick={handleClose}
        className="w-full py-3.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-white/15 transition-colors"
      >
        OK
      </button>
    </BasePopup>
  );
}
