'use client';

import React, { useEffect, useState } from 'react';
import { BasePopup } from './BasePopup';

interface SendToSelfPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEOUT_SEC = 3;

export function SendToSelfPopup({ isOpen, onClose }: SendToSelfPopupProps) {
  const [countdown, setCountdown] = useState(TIMEOUT_SEC);

  useEffect(() => {
    if (!isOpen) return;
    setCountdown(TIMEOUT_SEC);
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          setTimeout(() => onClose(), 0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isOpen, onClose]);

  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      titleId="send-to-self-title"
      accentColor="red"
    >
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center animate-[bounceSoft_0.6s_ease-out]">
          <svg
            className="w-7 h-7 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
      </div>
      <h2 id="send-to-self-title" className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Cannot send to yourself
      </h2>
      <p className="text-gray-600 dark:text-white/70 text-center text-sm">
        The recipient address matches your connected wallet. Please enter a different address.
      </p>
      <p className="text-gray-500 dark:text-white/50 text-center text-xs mt-4">
        Closing automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
      </p>
    </BasePopup>
  );
}
