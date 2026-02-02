'use client';

import { useBalancesContext, formatBalance } from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';
import { TokenIcon } from '@/components/swap/TokenIcon';

const SUPPORTED_USDC_CAIP19 = new Set([
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC Ethereum
  'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC Avalanche
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC Solana
]);

export default function PortfolioPage() {
  const { balances, loading, totalUsdValue, refetch } = useBalancesContext();
  const { isConnected } = useUserAddress();

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Portfolio</h1>
          <p className="text-white/60 mb-8">
            Connect your wallet to view your cross-chain balances
          </p>
          <div className="rounded-2xl bg-[#161616] border border-white/10 p-12 text-center">
            <p className="text-white/50">Connect EVM or Solana wallet from the header</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="animate-pulse text-white/60">Loading balances...</div>
      </div>
    );
  }

  const balanceList = Object.values(balances).filter((info) =>
    SUPPORTED_USDC_CAIP19.has(info.asset.caip19)
  );
  const totalUsdValueFiltered = balanceList.reduce((sum, info) => sum + info.usdValue, 0);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Portfolio</h1>
        <p className="text-white/60">USDC on Avalanche, Ethereum & Solana</p>
      </div>

      <div className="rounded-2xl bg-[#161616] border border-white/10 overflow-hidden mb-6">
        <div className="p-6 border-b border-white/10">
          <div className="text-sm text-white/50 mb-1">Total balance (USDC)</div>
          <div className="text-3xl font-bold text-white">
            ${totalUsdValueFiltered.toFixed(2)}
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {balanceList.length === 0 ? (
            <div className="p-8 text-center text-white/50">
              No USDC balances on Avalanche, Ethereum, or Solana. Swap or send to get started.
            </div>
          ) : (
            balanceList.map((info) => (
              <div
                key={info.asset.caip19}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TokenIcon asset={info.asset} size={48} showChainBadge />
                  <div>
                    <div className="font-semibold text-white">{info.asset.symbol}</div>
                    <div className="text-sm text-white/50">{info.asset.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">
                    {formatBalance(info.balance, info.asset)}
                  </div>
                  <div className="text-sm text-white/50">
                    ${info.usdValue.toFixed(2)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => refetch()}
        className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
      >
        Refresh balances
      </button>
    </div>
  );
}
