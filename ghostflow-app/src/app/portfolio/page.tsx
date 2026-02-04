'use client';

import { useEffect, useState } from 'react';
import { useBalancesContext, formatBalance } from '@silentswap/react';
import { getTokenDisplayLabel } from '@/lib/tokenDisplay';
import { useUserAddress } from '@/hooks/useUserAddress';
import { TokenIcon } from '@/components/swap/TokenIcon';
import { SUPPORTED_USDC_CAIP19 } from '@/lib/constants';

export default function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const { balances, loading, totalUsdValue, refetch } = useBalancesContext();
  const { isConnected } = useUserAddress();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Portfolio</h1>
          <p className="text-gray-600 dark:text-white/60 mb-8">
            Connect your wallet to view your cross-chain balances
          </p>
          <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-12 text-center shadow-lg dark:shadow-none">
            <p className="text-gray-600 dark:text-white/50">Connect EVM or Solana wallet from the header</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Portfolio</h1>
          <p className="text-gray-600 dark:text-white/60 mb-8">
            Connect your wallet to view your cross-chain balances
          </p>
          <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-12 text-center shadow-lg dark:shadow-none">
            <p className="text-gray-600 dark:text-white/50">Connect EVM or Solana wallet from the header</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="animate-pulse text-gray-600 dark:text-white/60">Loading balances...</div>
      </div>
    );
  }

  const balanceList = Object.values(balances)
    .filter((info) => SUPPORTED_USDC_CAIP19.has(info.asset.caip19))
    .sort((a, b) => b.usdValue - a.usdValue);
  const totalUsdValueFiltered = balanceList.reduce((sum, info) => sum + info.usdValue, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Portfolio</h1>
          <p className="text-gray-600 dark:text-white/60">USDC on Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon & Solana</p>
        </div>
        <button
          onClick={() => refetch()}
          className="shrink-0 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-white/15 active:scale-95 active:opacity-80 transition-all duration-150"
        >
          Refresh balances
        </button>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 overflow-hidden mb-6 shadow-lg dark:shadow-none">
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <div className="text-sm text-gray-500 dark:text-white/50 mb-1">Total balance (USDC)</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            ${totalUsdValueFiltered.toFixed(2)}
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-white/10">
          {balanceList.length === 0 ? (
            <div className="p-8 text-center text-gray-600 dark:text-white/50">
              No USDC balances on supported chains. Swap or send to get started.
            </div>
          ) : (
            balanceList.map((info) => (
              <div
                key={info.asset.caip19}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TokenIcon asset={info.asset} size={48} showChainBadge />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{getTokenDisplayLabel(info.asset)}</div>
                    <div className="text-sm text-gray-500 dark:text-white/50">{info.asset.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatBalance(info.balance, info.asset)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-white/50">
                    ${info.usdValue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
