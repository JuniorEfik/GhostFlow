'use client';

import React, { useState, useEffect } from 'react';
import { useUserAddress } from '@/hooks/useUserAddress';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useConnect, useDisconnect } from 'wagmi';

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function Header() {
  const [mounted, setMounted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { evmAddress, solAddress, isConnected } = useUserAddress();
  const { disconnect: disconnectSolana } = useWallet();

  useEffect(() => {
    setMounted(true);
  }, []);
  const { setVisible: setSolanaModalVisible } = useWalletModal();
  const { connect, connectors } = useConnect();
  const { disconnect: disconnectEVM } = useDisconnect();

  const handleConnectEVM = () => {
    const injected = connectors.find((c) => c.id === 'injected' || c.name?.toLowerCase().includes('injected'));
    if (injected) connect({ connector: injected });
    setShowMenu(false);
  };

  const handleConnectSolana = () => {
    setSolanaModalVisible(true);
    setShowMenu(false);
  };

  const connectedCount = [evmAddress, solAddress].filter(Boolean).length;
  const walletLabel = connectedCount === 2 ? '2 Wallets' : evmAddress ? 'EVM' : solAddress ? 'Solana' : null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-bold text-black text-lg">
            G
          </div>
          <span className="font-bold text-xl text-white">GhostFlow</span>
        </a>

        <nav className="hidden md:flex items-center gap-8">
          <a href="/" className="text-white/80 hover:text-white transition-colors font-medium">
            Swap
          </a>
          <a href="/send" className="text-white/80 hover:text-white transition-colors font-medium">
            Send
          </a>
          <a href="/portfolio" className="text-white/80 hover:text-white transition-colors font-medium">
            Portfolio
          </a>
          <a href="/orders" className="text-white/80 hover:text-white transition-colors font-medium">
            Orders
          </a>
        </nav>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              mounted && isConnected
                ? 'bg-white/10 hover:bg-white/15'
                : 'bg-amber-400 text-black hover:bg-amber-300 font-semibold'
            }`}
          >
            {mounted && isConnected && walletLabel ? (
              <>
                <span className="text-sm font-medium text-white">
                  {walletLabel}
                </span>
                {connectedCount === 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400">
                    {evmAddress ? 'EVM' : 'Solana'}
                  </span>
                )}
                {connectedCount === 2 && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    Both
                  </span>
                )}
              </>
            ) : (
              <span className={mounted && isConnected ? 'text-white' : ''}>
                {mounted && isConnected ? walletLabel ?? 'Wallets' : 'Connect'}
              </span>
            )}
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-xl overflow-hidden py-2">
                <div className="px-3 py-2 text-xs text-white/50 border-b border-white/10">
                  For EVM ↔ Solana swaps, connect both
                </div>
                <button
                  onClick={handleConnectEVM}
                  disabled={!!evmAddress}
                  className="w-full px-4 py-2.5 text-left text-white hover:bg-white/5 flex items-center justify-between disabled:opacity-70 disabled:cursor-default"
                >
                  <span>EVM (MetaMask, etc.)</span>
                  {evmAddress && (
                    <span className="text-emerald-400 text-xs">{truncateAddress(evmAddress)} ✓</span>
                  )}
                </button>
                <button
                  onClick={handleConnectSolana}
                  disabled={!!solAddress}
                  className="w-full px-4 py-2.5 text-left text-white hover:bg-white/5 flex items-center justify-between disabled:opacity-70 disabled:cursor-default"
                >
                  <span>Solana (Phantom, etc.)</span>
                  {solAddress && (
                    <span className="text-emerald-400 text-xs">{truncateAddress(solAddress)} ✓</span>
                  )}
                </button>
                {(evmAddress || solAddress) && (
                  <div className="border-t border-white/10 pt-2 mt-1">
                    {evmAddress && (
                      <button
                        onClick={() => { disconnectEVM(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 text-sm"
                      >
                        Disconnect EVM
                      </button>
                    )}
                    {solAddress && (
                      <button
                        onClick={() => { disconnectSolana(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/5 text-sm"
                      >
                        Disconnect Solana
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
