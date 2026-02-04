'use client';

import { SwapCard } from '@/components/swap/SwapCard';
import { SwapPageLayout } from '@/components/layout/SwapPageLayout';

export default function SwapPage() {
  return (
    <SwapPageLayout
      title="Swap"
      description="Cross-chain USDC swaps with privacy across Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon & Solana"
    >
      <SwapCard />
    </SwapPageLayout>
  );
}
