'use client';

import React, { useEffect, useState } from 'react';
import { BasePopup } from './BasePopup';

interface ConnectWalletPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEOUT_SEC = 3;

export function ConnectWalletPopup({ isOpen, onClose }: ConnectWalletPopupProps) {
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
      titleId="connect-wallet-title"
      accentColor="amber"
      zIndex={10001}
    >
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center animate-[bounceSoft_0.6s_ease-out]">
          <svg
            className="w-7 h-7 text-amber-600 dark:text-amber-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
      </div>
      <h2 id="connect-wallet-title" className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
        Connect your wallet
      </h2>
      <p className="text-gray-600 dark:text-white/70 text-center text-sm">
        Connect your EVM or Solana wallet.
      </p>
      <p className="text-gray-500 dark:text-white/50 text-center text-xs mt-4">
        Closing automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
      </p>
    </BasePopup>
  );
}
