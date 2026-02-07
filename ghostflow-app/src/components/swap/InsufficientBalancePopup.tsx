'use client';

import React from 'react';
import { BasePopup } from './BasePopup';

interface InsufficientBalancePopupProps {
  isOpen: boolean;
  onClose: () => void;
  inputAmount?: string | number;
  availableBalance?: string;
  action?: 'swap' | 'send';
}

export function InsufficientBalancePopup({
  isOpen,
  onClose,
  inputAmount = 0,
  availableBalance = '0',
  action = 'swap',
}: InsufficientBalancePopupProps) {
  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      titleId="insufficient-balance-title"
      accentColor="amber"
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
      <h2
        id="insufficient-balance-title"
        className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2"
      >
        Insufficient balance
      </h2>
      <p className="text-gray-600 dark:text-white/70 text-center text-sm mb-6">
        You are trying to {action} more than your available balance.
        {inputAmount != null && inputAmount !== '' && (
          <span className="block mt-2">
            Amount: <span className="text-gray-900 dark:text-white/90 font-medium">{String(inputAmount)} USDC</span>
          </span>
        )}
        {availableBalance != null && (
          <span className="block mt-1">
            Available: <span className="text-amber-600 dark:text-amber-400 font-semibold">{availableBalance} USDC</span>
          </span>
        )}
      </p>
      <button
        onClick={onClose}
        className="w-full py-3.5 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-[#1a1a1a]"
      >
        Got it
      </button>
    </BasePopup>
  );
}
