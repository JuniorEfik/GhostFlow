'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useSilentSwap,
  useSwap,
  useAssetsContext,
  useBalancesContext,
  usePricesContext,
  useOrdersContext,
  formatBalance,
} from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnect } from 'wagmi';
import { TokenSelector } from './TokenSelector';
import { MinimumAmountPopup } from './MinimumAmountPopup';
import { UserRejectedPopup } from './UserRejectedPopup';
import { SendToSelfPopup } from './SendToSelfPopup';
import { SUPPORTED_USDC_CAIP19, SUPPORTED_USDC_LIST, DEFAULT_SOURCE, DEFAULT_DEST } from '@/lib/constants';

const MIN_SWAP_USDC = 10;

/** Format USD with decimal point (e.g. $0.10) instead of comma */
function formatUsdDot(value: number): string {
  if (value == null || isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SwapCard({ mode: modeProp }: { mode?: 'swap' | 'send' } = {}) {
  const pathname = usePathname();
  const mode = modeProp ?? (pathname === '/send' ? 'send' : 'swap');
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  const { connect, connectors } = useConnect();
  const { evmAddress, solAddress, isConnected } = useUserAddress();
  const { getAsset } = useAssetsContext();
  const { balances, refetch: refetchBalances } = useBalancesContext();
  const { refreshOrders } = useOrdersContext();
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
    swapTokens,
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
    clearQuote,
    wallet,
    walletLoading,
    authLoading,
  } = useSilentSwap();

  const isPreparingWallet = authLoading || walletLoading;
  const isWalletReady = !!wallet;
  const [mounted, setMounted] = useState(false);
  const [showMinAmountPopup, setShowMinAmountPopup] = useState(false);
  const [minAmountPopupValue, setMinAmountPopupValue] = useState(0);
  const [showUserRejectedPopup, setShowUserRejectedPopup] = useState(false);
  const [showSendToSelfPopup, setShowSendToSelfPopup] = useState(false);
  const [inputUsd, setInputUsd] = useState(0);

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
      !SUPPORTED_USDC_CAIP19.has(destAsset)
    ) {
      const contact = destinations[0]?.contact ?? '';
      setDestinations([{ asset: DEFAULT_DEST, contact, amount: '' }]);
      setSplits([1]);
    }
  }, [destinations.length, destinations[0]?.asset]);

  // Swap tab: if source and destination are same chain, switch destination to another chain
  useEffect(() => {
    if (mode !== 'swap' || !tokenIn || !destinations[0]?.asset) return;
    const sourceChain = tokenIn.caip19.split('/')[0];
    const destAsset = destinations[0].asset;
    const destChain = destAsset.split('/')[0];
    if (sourceChain !== destChain) return;
    const otherCaip19 = SUPPORTED_USDC_LIST.find((caip19) => caip19.split('/')[0] !== sourceChain);
    if (!otherCaip19) return;
    const isNewDestSolana = otherCaip19.startsWith('solana:');
    const evmChainMatch = otherCaip19.match(/^eip155:(\d+)/);
    const evmChainId = evmChainMatch ? evmChainMatch[1] : '1';
    const contact = isNewDestSolana && solAddress
      ? `caip10:solana:*:${solAddress}`
      : evmAddress
        ? `caip10:eip155:${evmChainId}:${evmAddress}`
        : destinations[0].contact ?? '';
    setDestinations((prev) =>
      prev.map((d, i) => (i === 0 ? { ...d, asset: otherCaip19, contact } : d))
    );
    setSplits([1]);
    clearQuote();
  }, [mode, tokenIn?.caip19, destinations[0]?.asset]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute inputUsd in effect to avoid getPrice triggering PricesProvider update during render
  useEffect(() => {
    if (!tokenIn || !inputAmount) {
      setInputUsd(0);
      return;
    }
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      setInputUsd(0);
      return;
    }
    const price = getPrice(tokenIn) || 1;
    setInputUsd(amount * price);
  }, [tokenIn, inputAmount, getPrice]);

  // Refresh balances and orders after successful swap
  useEffect(() => {
    if (orderComplete && orderId) {
      refetchBalances();
      refreshOrders();
    }
  }, [orderComplete, orderId, refetchBalances, refreshOrders]);

  // SDK catches errors internally and sets swapError (doesn't throw) - show friendly popup for user rejection
  useEffect(() => {
    if (!swapError) return;
    const msg = swapError instanceof Error ? swapError.message : String(swapError);
    const err = swapError as Error & { code?: number };
    const isUserRejected =
      msg.toLowerCase().includes('user rejected') ||
      msg.toLowerCase().includes('rejected the request') ||
      msg.toLowerCase().includes('user denied') ||
      msg.toLowerCase().includes('rejected') ||
      err?.code === 4001; // UserRejectedRequestError
    if (isUserRejected) {
      setShowUserRejectedPopup(true);
      clearQuote();
    }
  }, [swapError, clearQuote]);

  // Swap tab only: auto-fill recipient with connected wallet
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

      const amount = parseFloat(inputAmount);
      if (amount < MIN_SWAP_USDC) {
        setMinAmountPopupValue(amount);
        setShowMinAmountPopup(true);
        return;
      }

      if (!SUPPORTED_USDC_CAIP19.has(tokenIn.caip19)) {
        alert('Only USDC on Arbitrum, Avalanche, Base, BSC, Ethereum, Polygon, or Solana is supported for private swaps.');
        return;
      }
      if (!SUPPORTED_USDC_CAIP19.has(dest.asset)) {
        alert('Destination must be USDC on Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon, or Solana.');
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

      // Block send-to-self
      const destContact = dest.contact ?? '';
      if (destContact && destContact === senderContactId) {
        setShowSendToSelfPopup(true);
        return;
      }
      // Also check by address (in case of different chain formats for same address)
      const destAddr = destContact.split(':').pop()?.toLowerCase() ?? '';
      const senderAddr = senderContactId.split(':').pop()?.toLowerCase() ?? '';
      if (destAddr && senderAddr && destAddr === senderAddr) {
        setShowSendToSelfPopup(true);
        return;
      }

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
      const isUserRejected =
        msg.toLowerCase().includes('user rejected') ||
        msg.toLowerCase().includes('rejected the request');
      if (isUserRejected) {
        setShowUserRejectedPopup(true);
        return;
      }
      const isQuoteError =
        msg.toLowerCase().includes('failed to get quote') ||
        msg.toLowerCase().includes('500') ||
        msg.toLowerCase().includes('internal server');
      const displayMsg = isQuoteError
        ? 'Quote service is temporarily unavailable. Please try again in a few moments.'
        : msg || 'Swap failed. Please try again.';
      alert(displayMsg);
    }
  };

  const connectEVM = () => {
    const injected = connectors.find((c) => c.id === 'injected');
    if (injected) connect({ connector: injected });
  };

  if (orderComplete && orderId) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
        <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">Swap Complete!</h2>
        <p className="text-gray-800 dark:text-white/80 mb-2">Order ID: {orderId}</p>
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
  const estReceiveUsd = Math.max(0, inputUsd - totalDeductedUsd);

  const recipientAddress = destinations[0]?.contact?.split(':').pop() ?? '';

  return (
    <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-none">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex gap-2">
          <Link
            href="/"
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'swap'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
            }`}
          >
            Swap
          </Link>
          <Link
            href="/send"
            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
              mode === 'send'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
            }`}
          >
            Send
          </Link>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Input */}
        <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-200 dark:border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-white/50">{mode === 'send' ? 'You send' : 'You pay'}</span>
            {tokenIn && (
              <span className="text-xs text-gray-500 dark:text-white/40">
                Balance: {balances[tokenIn.caip19]
                  ? formatBalance(balances[tokenIn.caip19].balance, tokenIn)
                  : '—'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-white/30 min-w-0"
                disabled={isSwapping}
              />
              {tokenIn && balances[tokenIn.caip19] && balances[tokenIn.caip19].balance > BigInt(0) && (
                <button
                  type="button"
                  onClick={() =>
                    setInputAmount(formatBalance(balances[tokenIn.caip19].balance, tokenIn))
                  }
                  disabled={isSwapping}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium hover:bg-amber-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Max
                </button>
              )}
            </div>
            <TokenSelector
              selectedAsset={tokenIn}
              onSelect={setTokenIn}
              filter="ingress"
              disabled={isSwapping}
            />
          </div>
        </div>

        {/* Switch tokens (swap only) */}
        {mode === 'swap' &&
          tokenIn &&
          destinations[0]?.asset &&
          SUPPORTED_USDC_CAIP19.has(destinations[0].asset) && (
          <div className="flex items-center justify-center h-12 -my-5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dest = destinations[0];
                if (!dest || !tokenIn) return;
                swapTokens(inputAmount);
                setDestinations((prev) => {
                  const newDestAsset = prev[0]?.asset;
                  if (!newDestAsset) return prev;
                  const isNewDestSolana = newDestAsset.startsWith('solana:');
                  const evmChainMatch = newDestAsset.match(/^eip155:(\d+)/);
                  const evmChainId = evmChainMatch ? evmChainMatch[1] : '1';
                  const contact =
                    isNewDestSolana && solAddress
                      ? `caip10:solana:*:${solAddress}`
                      : evmAddress
                        ? `caip10:eip155:${evmChainId}:${evmAddress}`
                        : prev[0]?.contact ?? '';
                  return prev.map((d, i) => (i === 0 ? { ...d, contact } : d));
                });
                clearQuote();
              }}
              disabled={isSwapping}
              className="relative z-20 w-10 h-10 rounded-full bg-white dark:bg-[#161616] border-2 border-gray-300 dark:border-white/20 flex items-center justify-center text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-amber-500 hover:border-amber-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              title="Switch tokens"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        )}

        {/* Output / Recipient */}
        <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-200 dark:border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 dark:text-white/50">
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
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border-2 border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 outline-none focus:border-amber-500/50"
                disabled={isSwapping}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-white/50">They receive</span>
                <TokenSelector
                  selectedAsset={destAsset ?? null}
                  onSelect={(asset) => {
                    const addr = recipientAddress;
                    const evmChainMatch = asset.caip19.match(/^eip155:(\d+)/);
                    const recipient = addr
                      ? asset.caip19.startsWith('solana:')
                        ? `caip10:solana:*:${addr}`
                        : evmChainMatch
                        ? `caip10:eip155:${evmChainMatch[1]}:${addr}`
                        : `caip10:eip155:1:${addr}`
                      : '';
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
            <span className="flex-1 text-2xl font-semibold text-gray-600 dark:text-white/60">
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
            <span>${formatUsdDot(serviceFeeUsd)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-white/70">
            <span>Bridge fee (in)</span>
            <span>${formatUsdDot(bridgeFeeIngressUsd)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-white/70">
            <span>Bridge fee (out)</span>
            <span>${formatUsdDot(bridgeFeeEgressUsd)}</span>
          </div>
          <div className="flex justify-between text-gray-700 dark:text-white/70">
            <span>Price impact</span>
            <span className="text-red-600 dark:text-red-400">
              -${formatUsdDot(slippageUsd)}
            </span>
          </div>
          <div className="flex justify-between text-gray-900 dark:text-white/90 border-t border-gray-200 dark:border-white/10 pt-2 mt-2">
            <span>Total deducted</span>
            <span>${formatUsdDot(totalDeductedUsd)}</span>
          </div>
          {inputUsd > 0 && (
            <div className="flex justify-between text-gray-900 dark:text-white/90">
              <span>Est. you receive</span>
              <span>≈${formatUsdDot(estReceiveUsd)}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-white/40 mt-2">
            Small amounts may have higher effective fees. Cross-chain swaps to Ethereum incur higher bridge costs.
          </p>
        </div>

        {/* Error - hide for user rejection (we show UserRejectedPopup instead) */}
        {swapError && (() => {
          const msg = swapError instanceof Error ? swapError.message : String(swapError);
          const err = swapError as Error & { code?: number };
          const isUserRejected =
            msg.toLowerCase().includes('user rejected') ||
            msg.toLowerCase().includes('rejected the request') ||
            msg.toLowerCase().includes('user denied') ||
            msg.toLowerCase().includes('rejected') ||
            err?.code === 4001;
          if (isUserRejected) return null;
          return (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {msg}
              </p>
            </div>
          );
        })()}

        {/* Status */}
        {isSwapping && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="font-semibold text-amber-400 mb-2">
              Status: {currentStep || 'Processing'}
            </p>
            <div className="space-y-1">
              {orderStatusTexts.map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-800 dark:text-white/80">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect / Swap button - defer wallet-dependent UI until mounted to avoid hydration mismatch */}
        {!mounted ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 animate-pulse" />
              <div className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 animate-pulse" />
            </div>
            <p className="text-xs text-gray-500 dark:text-white/50 text-center">
              For EVM ↔ Solana swaps, connect both via the header
            </p>
          </div>
        ) : !isConnected ? (
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
                className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors border border-gray-300 dark:border-white/20"
              >
                Connect Solana
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/50 text-center">
              For EVM ↔ Solana swaps, connect both via the header
            </p>
          </div>
        ) : !evmAddress || !solAddress ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              {!evmAddress && (
                <button
                  onClick={connectEVM}
                  className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors border border-gray-300 dark:border-white/20"
                >
                  + Connect EVM
                </button>
              )}
              {!solAddress && (
                <button
                  onClick={() => setSolanaModalVisible(true)}
                  className="flex-1 py-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors border border-gray-300 dark:border-white/20"
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
                !dest ||
                isPreparingWallet ||
                !isWalletReady
              }
              className="w-full py-4 rounded-xl bg-amber-400 text-black font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors disabled:hover:bg-amber-400"
            >
              {isSwapping
                ? mode === 'send'
                  ? 'Sending...'
                  : 'Swapping...'
                : isPreparingWallet
                  ? authLoading
                    ? 'Sign in with wallet...'
                    : 'Preparing wallet...'
                  : !isWalletReady
                    ? 'Wallet not ready'
                    : mode === 'send'
                      ? 'Send'
                      : 'Swap'}
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
              !dest ||
              isPreparingWallet ||
              !isWalletReady
            }
            className="w-full py-4 rounded-xl bg-amber-400 text-black font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-300 transition-colors disabled:hover:bg-amber-400"
          >
            {isSwapping
              ? mode === 'send'
                ? 'Sending...'
                : 'Swapping...'
              : isPreparingWallet
                ? authLoading
                  ? 'Sign in with wallet...'
                  : 'Preparing wallet...'
                : !isWalletReady
                  ? 'Wallet not ready'
                  : mode === 'send'
                    ? 'Send'
                    : 'Swap'}
          </button>
        )}
      </div>

      <MinimumAmountPopup
        isOpen={showMinAmountPopup}
        onClose={() => setShowMinAmountPopup(false)}
        currentAmount={minAmountPopupValue}
      />
      <UserRejectedPopup
        isOpen={showUserRejectedPopup}
        onClose={() => setShowUserRejectedPopup(false)}
      />
      <SendToSelfPopup
        isOpen={showSendToSelfPopup}
        onClose={() => setShowSendToSelfPopup(false)}
      />
    </div>
  );
}
