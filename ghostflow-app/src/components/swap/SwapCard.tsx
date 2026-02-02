'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useSilentSwap,
  useSwap,
  useAssetsContext,
  useBalancesContext,
  usePricesContext,
  formatBalance,
  formatUsdValue,
} from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnect } from 'wagmi';
import { TokenSelector } from './TokenSelector';

const DEFAULT_SOURCE = 'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'; // USDC Avalanche
const DEFAULT_DEST = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC Ethereum

export function SwapCard({ mode: modeProp }: { mode?: 'swap' | 'send' } = {}) {
  const pathname = usePathname();
  const mode = modeProp ?? (pathname === '/send' ? 'send' : 'swap');
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  const { connect, connectors } = useConnect();
  const { evmAddress, solAddress, isConnected } = useUserAddress();
  const { getAsset } = useAssetsContext();
  const { balances } = useBalancesContext();
  const { getPrice } = usePricesContext();

  const {
    tokenIn,
    inputAmount,
    setInputAmount,
    setTokenIn,
    destinations,
    setDestinations,
    setSplits,
    splits,
    updateDestinationContact,
  } = useSwap();

  const {
    executeSwap,
    isSwapping,
    swapLoading,
    currentStep,
    orderId,
    orderComplete,
    orderStatusTexts,
    handleNewSwap,
    serviceFeeUsd,
    bridgeFeeIngressUsd,
    bridgeFeeEgressUsd,
    slippageUsd,
    overheadUsd,
    egressEstimatesLoading,
    fetchEstimates,
    swapError,
  } = useSilentSwap();

  const SUPPORTED_USDC = new Set([
    'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ]);

  // Initialize default tokens
  useEffect(() => {
    const src = getAsset(DEFAULT_SOURCE);
    const dst = getAsset(DEFAULT_DEST);
    if (src && !tokenIn) setTokenIn(src);
  }, [getAsset, tokenIn, setTokenIn]);

  // Normalize to single USDC destination on mount (fix persisted state from WBTC/other assets)
  useEffect(() => {
    const destAsset = destinations[0]?.asset ?? '';
    if (
      destinations.length === 0 ||
      destinations.length > 1 ||
      !SUPPORTED_USDC.has(destAsset)
    ) {
      const contact = destinations[0]?.contact ?? '';
      setDestinations([{ asset: DEFAULT_DEST, contact, amount: '' }]);
      setSplits([1]);
    }
  }, [destinations.length, destinations[0]?.asset]);

  useEffect(() => {
    if (mode === 'send' || destinations.length === 0) return;
    const destAsset = destinations[0]?.asset || '';
    const isDestSolana = destAsset.startsWith('solana:');
    const evmChainMatch = destAsset.match(/^eip155:(\d+)/);
    const evmChainId = evmChainMatch ? evmChainMatch[1] : '43114';
    const recipient = isDestSolana && solAddress
      ? `caip10:solana:*:${solAddress}`
      : evmAddress
      ? `caip10:eip155:${evmChainId}:${evmAddress}`
      : '';
    if (recipient) {
      setDestinations((prev) =>
        prev.map((d, i) => (i === 0 ? { ...d, contact: recipient } : d))
      );
    }
  }, [mode, evmAddress, solAddress]);

  // Fetch estimates when swap params change - use long debounce so user can finish typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchEstimatesRef = useRef(fetchEstimates);
  fetchEstimatesRef.current = fetchEstimates;
  const destAssetsKey = destinations.map((d) => d.asset).join(',');

  useEffect(() => {
    if (mode === 'send') return;
    if (!tokenIn || !destinations.length || !destinations[0]?.asset) return;

    const amount = parseFloat(inputAmount);
    if (!inputAmount || isNaN(amount) || amount <= 0) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchEstimatesRef.current();
    }, 1000);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [mode, tokenIn?.caip19, inputAmount, destAssetsKey]);

  const handleExecute = async () => {
    try {
      if (!tokenIn || !inputAmount) return;
      const dest = destinations[0];
      if (!dest) return;

      if (!SUPPORTED_USDC.has(tokenIn.caip19)) {
        alert('Only USDC on Avalanche, Ethereum, or Solana is supported for private swaps.');
        return;
      }
      if (!SUPPORTED_USDC.has(dest.asset)) {
        alert('Destination must be USDC on Avalanche, Ethereum, or Solana.');
        return;
      }

      const isSourceSolana = tokenIn.caip19.startsWith('solana:');
      const isSourceBitcoin = tokenIn.caip19.startsWith('bip122:');
      let senderContactId = '';
      if (isSourceSolana && solAddress) {
        senderContactId = `caip10:solana:*:${solAddress}`;
      } else if (isSourceBitcoin) {
        senderContactId = ''; // Bitcoin not yet
      } else if (evmAddress) {
        const evmChainMatch = tokenIn.caip19.match(/^eip155:(\d+)/);
        const evmChainId = evmChainMatch ? evmChainMatch[1] : '1';
        senderContactId = `caip10:eip155:${evmChainId}:${evmAddress}`;
      }

      if (!senderContactId) return;

      // Force single destination, 100% to output (no splits to ETH or other assets)
      await executeSwap({
        sourceAsset: tokenIn.caip19,
        sourceAmount: inputAmount,
        destinations: [dest],
        splits: [1],
        senderContactId,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Swap failed:', err);
      alert(msg || 'Swap failed. Please try again.');
    }
  };

  const connectEVM = () => {
    const injected = connectors.find((c) => c.id === 'injected');
    if (injected) connect({ connector: injected });
  };

  if (orderComplete && orderId) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <h2 className="text-xl font-bold text-emerald-400 mb-4">Swap Complete!</h2>
        <p className="text-white/80 mb-2">Order ID: {orderId}</p>
        <button
          onClick={handleNewSwap}
          className="mt-4 px-6 py-3 bg-amber-400 text-black font-semibold rounded-xl hover:bg-amber-300 transition-colors"
        >
          New Swap
        </button>
      </div>
    );
  }

  const dest = destinations[0];
  const destAsset = dest ? getAsset(dest.asset) : null;
  const totalFeesUsd = serviceFeeUsd + bridgeFeeIngressUsd + bridgeFeeEgressUsd;
  const totalDeductedUsd = totalFeesUsd + slippageUsd;
  const inputUsd =
    tokenIn && inputAmount && parseFloat(inputAmount) > 0
      ? parseFloat(inputAmount) * (getPrice(tokenIn) || 1)
      : 0;
  const estReceiveUsd = Math.max(0, inputUsd - totalDeductedUsd);

  const recipientAddress = destinations[0]?.contact?.split(':').pop() ?? '';

  return (
    <div className="rounded-2xl bg-[#161616] border border-white/10 overflow-hidden">
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'swap'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Swap
          </Link>
          <Link
            href="/send"
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'send'
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Send
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Input */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/50">{mode === 'send' ? 'You send' : 'You pay'}</span>
            {tokenIn && (
              <span className="text-xs text-white/40">
                Balance: {balances[tokenIn.caip19]
                  ? formatBalance(balances[tokenIn.caip19].balance, tokenIn)
                  : '—'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-semibold text-white outline-none placeholder-white/30 min-w-0"
              disabled={isSwapping}
            />
            <TokenSelector
              selectedAsset={tokenIn}
              onSelect={setTokenIn}
              filter="ingress"
              disabled={isSwapping}
            />
          </div>
        </div>

        {/* Output / Recipient */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/50">
              {mode === 'send' ? 'Recipient address' : 'You receive'}
            </span>
          </div>
          {mode === 'send' ? (
            <div className="space-y-3">
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => {
                  const addr = e.target.value.trim();
                  const destAsset = destinations[0]?.asset || '';
                  const isDestSolana = destAsset.startsWith('solana:');
                  const evmChainMatch = destAsset.match(/^eip155:(\d+)/);
                  const evmChainId = evmChainMatch ? evmChainMatch[1] : '1';
                  const contact = addr
                    ? isDestSolana || !addr.startsWith('0x')
                      ? `caip10:solana:*:${addr}`
                      : `caip10:eip155:${evmChainId}:${addr}`
                    : '';
                  if (destinations.length > 0) {
                    updateDestinationContact(0, contact);
                  } else {
                    setDestinations([{ asset: DEFAULT_DEST, contact, amount: '' }]);
                  }
                }}
                placeholder="0x... or base58 address"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-amber-500/50"
                disabled={isSwapping}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/50">They receive</span>
                <TokenSelector
                  selectedAsset={destAsset ?? null}
                  onSelect={(asset) => {
                    const addr = recipientAddress || (evmAddress ?? solAddress ?? '');
                    const evmChainMatch = asset.caip19.match(/^eip155:(\d+)/);
                    const recipient = asset.caip19.startsWith('solana:')
                      ? `caip10:solana:*:${addr}`
                      : evmChainMatch
                      ? `caip10:eip155:${evmChainMatch[1]}:${addr}`
                      : `caip10:eip155:1:${addr}`;
                    if (destinations.length > 0) {
                      setDestinations((prev) =>
                        prev.map((d, i) =>
                          i === 0 ? { ...d, asset: asset.caip19, contact: recipient } : d
                        )
                      );
                    } else {
                      setDestinations([{ asset: asset.caip19, contact: recipient, amount: '' }]);
                    }
                  }}
                  filter="egress"
                  disabled={isSwapping}
                />
              </div>
            </div>
          ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="flex-1 text-2xl font-semibold text-white/60">
              {egressEstimatesLoading ? '...' : dest?.amount || '0.0'}
            </span>
            <TokenSelector
              selectedAsset={destAsset ?? null}
              onSelect={(asset) => {
                const evmChainMatch = asset.caip19.match(/^eip155:(\d+)/);
                const recipient = asset.caip19.startsWith('solana:') && solAddress
                  ? `caip10:solana:*:${solAddress}`
                  : evmAddress && evmChainMatch
                  ? `caip10:eip155:${evmChainMatch[1]}:${evmAddress}`
                  : evmAddress
                  ? `caip10:eip155:1:${evmAddress}`
                  : destinations[0]?.contact ?? '';
                if (destinations.length > 0) {
                  setDestinations((prev) =>
                    prev.map((d, i) =>
                      i === 0 ? { ...d, asset: asset.caip19, contact: recipient || d.contact } : d
                    )
                  );
                } else {
                  setDestinations([{ asset: asset.caip19, contact: recipient, amount: '' }]);
                }
              }}
              filter="egress"
              disabled={isSwapping}
            />
          </div>
          )}
        </div>

        {/* Fee breakdown */}
        <div className="rounded-xl bg-white/5 p-4 space-y-2 text-sm">
          <div className="flex justify-between text-white/70">
            <span>Service fee</span>
            <span>${formatUsdValue(serviceFeeUsd) ?? '0.00'}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Bridge fee (in)</span>
            <span>${formatUsdValue(bridgeFeeIngressUsd) ?? '0.00'}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Bridge fee (out)</span>
            <span>${formatUsdValue(bridgeFeeEgressUsd) ?? '0.00'}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Price impact</span>
            <span className="text-red-400/80">
              -${formatUsdValue(slippageUsd) ?? '0.00'}
            </span>
          </div>
          <div className="flex justify-between text-white/90 border-t border-white/10 pt-2 mt-2">
            <span>Total deducted</span>
            <span>${formatUsdValue(totalDeductedUsd) ?? '0.00'}</span>
          </div>
          {inputUsd > 0 && (
            <div className="flex justify-between text-white/90">
              <span>Est. you receive</span>
              <span>≈${formatUsdValue(estReceiveUsd) ?? '0.00'}</span>
            </div>
          )}
          <p className="text-xs text-white/40 mt-2">
            Small amounts may have higher effective fees. Cross-chain swaps to Ethereum incur higher bridge costs.
          </p>
        </div>

        {/* Error */}
        {swapError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">
              {swapError instanceof Error ? swapError.message : String(swapError)}
            </p>
          </div>
        )}

        {/* Status */}
        {isSwapping && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="font-semibold text-amber-400 mb-2">
              Status: {currentStep || 'Processing'}
            </p>
            <div className="space-y-1">
              {orderStatusTexts.map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect / Swap button */}
        {!isConnected ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={connectEVM}
                className="flex-1 py-4 rounded-xl bg-amber-400 text-black font-bold hover:bg-amber-300 transition-colors"
              >
                Connect EVM
              </button>
              <button
                onClick={() => setSolanaModalVisible(true)}
                className="flex-1 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/20"
              >
                Connect Solana
              </button>
            </div>
            <p className="text-xs text-white/50 text-center">
              For EVM ↔ Solana swaps, connect both via the header
            </p>
          </div>
        ) : !evmAddress || !solAddress ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              {!evmAddress && (
                <button
                  onClick={connectEVM}
                  className="flex-1 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/20"
                >
                  + Connect EVM
                </button>
              )}
              {!solAddress && (
                <button
                  onClick={() => setSolanaModalVisible(true)}
                  className="flex-1 py-4 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/20"
                >
                  + Connect Solana
                </button>
              )}
            </div>
            <button
              onClick={handleExecute}
              disabled={
                isSwapping ||
                swapLoading ||
                egressEstimatesLoading ||
                !inputAmount ||
                !tokenIn ||
                !dest
              }
              className="w-full py-4 rounded-xl bg-amber-400 text-black font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors disabled:hover:bg-amber-400"
            >
              {isSwapping ? (mode === 'send' ? 'Sending...' : 'Swapping...') : mode === 'send' ? 'Send' : 'Swap'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleExecute}
            disabled={
              isSwapping ||
              swapLoading ||
              egressEstimatesLoading ||
              !inputAmount ||
              !tokenIn ||
              !dest
            }
            className="w-full py-4 rounded-xl bg-amber-400 text-black font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors disabled:hover:bg-amber-400"
          >
            {isSwapping ? (mode === 'send' ? 'Sending...' : 'Swapping...') : mode === 'send' ? 'Send' : 'Swap'}
          </button>
        )}
      </div>
    </div>
  );
}
