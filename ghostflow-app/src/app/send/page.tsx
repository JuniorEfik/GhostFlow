'use client';

import { SwapCard } from '@/components/swap/SwapCard';

export default function SendPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Send</h1>
          <p className="text-white/60">
            Send assets across chains to any wallet address
          </p>
        </div>
        <SwapCard mode="send" />
      </div>
    </div>
  );
}
