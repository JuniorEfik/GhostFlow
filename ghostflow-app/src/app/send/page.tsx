'use client';

import { SwapCard } from '@/components/swap/SwapCard';
import { SwapPageLayout } from '@/components/layout/SwapPageLayout';

export default function SendPage() {
  return (
    <SwapPageLayout
      title="Send"
      description="Send USDC across chains to any wallet address"
    >
      <SwapCard mode="send" />
    </SwapPageLayout>
  );
}
