'use client';

import { SwapCard } from '@/components/swap/SwapCard';
import { SwapPageLayout } from '@/components/layout/SwapPageLayout';

export default function HomePage() {
  return (
    <SwapPageLayout
      title="Swap Across Chains"
      description="Send and swap USDC privately across Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon & Solana"
      showGradient
    >
      <SwapCard />
    </SwapPageLayout>
  );
}
