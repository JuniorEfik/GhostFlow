'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAssetsContext, useBalancesContext, formatBalance } from '@silentswap/react';

function formatUsdDot(value: number): string {
  if (value == null || isNaN(value)) return '0.00';
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

import type { AssetInfo } from '@silentswap/sdk';
import { getTokenDisplayLabel } from '@/lib/tokenDisplay';
import { SUPPORTED_USDC_CAIP19 } from '@/lib/constants';
import { useUserAddress } from '@/hooks/useUserAddress';
import { TokenIcon } from './TokenIcon';
import { ConnectWalletPopup } from './ConnectWalletPopup';

interface TokenSelectorProps {
  selectedAsset: AssetInfo | null;
  onSelect: (asset: AssetInfo) => void;
  filter?: 'ingress' | 'egress';
  disabled?: boolean;
}

export function TokenSelector({
  selectedAsset,
  onSelect,
  filter,
  disabled,
}: TokenSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [showConnectPopup, setShowConnectPopup] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { evmAddress, solAddress } = useUserAddress();
  const hasWallet = !!(evmAddress || solAddress);
  const { getFilteredAssets, loading } = useAssetsContext();
  const { balances } = useBalancesContext();

  const assets = useMemo(() => {
    const all = getFilteredAssets(filter ? { [filter]: true } : undefined);
    const supported = all.filter((a) => SUPPORTED_USDC_CAIP19.has(a.caip19));
    const filtered = !search.trim()
      ? supported
      : supported.filter((a) => {
          const q = search.toLowerCase();
          return (
            a.symbol.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q) ||
            a.caip19.toLowerCase().includes(q)
          );
        });
    return [...filtered].sort((a, b) => {
      const balA = balances[a.caip19];
      const balB = balances[b.caip19];
      const hasBalanceA = balA && balA.balance > BigInt(0);
      const hasBalanceB = balB && balB.balance > BigInt(0);
      if (hasBalanceA && !hasBalanceB) return -1;
      if (!hasBalanceA && hasBalanceB) return 1;
      if (hasBalanceA && hasBalanceB && balA && balB) {
        return balB.usdValue - balA.usdValue;
      }
      return 0;
    }).slice(0, 50);
  }, [getFilteredAssets, filter, search, balances]);

  useEffect(() => {
    if (!open || !triggerRef.current || typeof document === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const DROPDOWN_HEIGHT = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: 288,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 8 }
        : { top: rect.bottom + 8 }),
      zIndex: 9999,
    });
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (disabled) return;
          if (!hasWallet) {
            setShowConnectPopup(true);
            return;
          }
          setOpen(!open);
        }}
        disabled={disabled}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors min-w-[120px] disabled:opacity-50"
      >
        {selectedAsset ? (
          <>
            <TokenIcon asset={selectedAsset} size={32} showChainBadge />
            <span className="font-medium truncate text-gray-900 dark:text-white">{(selectedAsset.symbol || 'USDC').toUpperCase()}</span>
          </>
        ) : (
          <span className="text-gray-600 dark:text-white/60">Select token</span>
        )}
        <svg
          className={`w-4 h-4 text-gray-600 dark:text-white/60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              style={dropdownStyle}
              className="rounded-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden flex flex-col max-h-80"
            >
              <div className="p-3 border-b border-gray-200 dark:border-white/10 shrink-0">
                <input
                  type="text"
                  placeholder="Search name or symbol"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/40 outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="overflow-y-auto flex-1 min-h-0">
                {loading ? (
                  <div className="p-6 text-center text-gray-600 dark:text-white/50">Loading...</div>
                ) : assets.length === 0 ? (
                  <div className="p-6 text-center text-gray-600 dark:text-white/50">No tokens found</div>
                ) : (() => {
                  const withBalance = assets.filter((a) => {
                    const b = balances[a.caip19];
                    return b && b.balance > BigInt(0);
                  });
                  const withoutBalance = assets.filter((a) => {
                    const b = balances[a.caip19];
                    return !b || b.balance === BigInt(0);
                  });
                  return (
                    <>
                      {withBalance.length > 0 && (
                        <div className="px-4 pt-2 pb-1">
                          <div className="text-xs font-medium text-amber-600 dark:text-amber-400/80 uppercase tracking-wider">
                            Your tokens
                          </div>
                        </div>
                      )}
                      {withBalance.map((asset) => {
                    const balanceInfo = balances[asset.caip19];
                    const balanceStr = balanceInfo
                      ? formatBalance(balanceInfo.balance, asset)
                      : null;
                    const usdStr = balanceInfo
                      ? formatUsdDot(balanceInfo.usdValue)
                      : null;
                    return (
                      <button
                        key={asset.caip19}
                        type="button"
                        onClick={() => {
                          onSelect(asset);
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <TokenIcon asset={asset} size={40} showChainBadge />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-gray-900 dark:text-white">{getTokenDisplayLabel(asset)}</div>
                          <div className="text-sm text-gray-500 dark:text-white/50 truncate">{asset.name}</div>
                        </div>
                        {(balanceStr != null || usdStr != null) && (
                          <div className="text-right shrink-0">
                            {balanceStr != null && (
                              <div className="font-medium text-gray-900 dark:text-white truncate max-w-[80px]" title={balanceStr}>
                                {balanceStr}
                              </div>
                            )}
                            {usdStr != null && (
                              <div className="text-sm text-gray-500 dark:text-white/50">
                                ${usdStr}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                      {withoutBalance.length > 0 && (
                        <div className="px-4 pt-3 pb-1 border-t border-gray-200 dark:border-white/5 mt-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider">
                            All tokens
                          </div>
                        </div>
                      )}
                      {withoutBalance.map((asset) => {
                    const balanceInfo = balances[asset.caip19];
                    const balanceStr = balanceInfo
                      ? formatBalance(balanceInfo.balance, asset)
                      : null;
                    const usdStr = balanceInfo
                      ? formatUsdDot(balanceInfo.usdValue)
                      : null;
                    return (
                      <button
                        key={asset.caip19}
                        type="button"
                        onClick={() => {
                          onSelect(asset);
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left"
                      >
                        <TokenIcon asset={asset} size={40} showChainBadge />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-gray-900 dark:text-white">{getTokenDisplayLabel(asset)}</div>
                          <div className="text-sm text-gray-500 dark:text-white/50 truncate">{asset.name}</div>
                        </div>
                        {(balanceStr != null || usdStr != null) && (
                          <div className="text-right shrink-0">
                            {balanceStr != null && (
                              <div className="font-medium text-gray-600 dark:text-white/60 truncate max-w-[80px]" title={balanceStr}>
                                {balanceStr}
                              </div>
                            )}
                            {usdStr != null && (
                              <div className="text-sm text-gray-500 dark:text-white/40">
                                ${usdStr}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                    </>
                  );
                })()}
              </div>
            </div>
          </>,
          document.body
        )}
      <ConnectWalletPopup
        isOpen={showConnectPopup}
        onClose={() => setShowConnectPopup(false)}
      />
    </div>
  );
}
