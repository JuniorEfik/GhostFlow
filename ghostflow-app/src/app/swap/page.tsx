'use client';

import { SwapCard } from '@/components/swap/SwapCard';

export default function SwapPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Swap</h1>
          <p className="text-white/60">
            Cross-chain swaps with privacy across EVM, Solana, and more
          </p>
        </div>
        <SwapCard />
      </div>
    </div>
  );
}
