'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserAddress } from '@/hooks/useUserAddress';
import { useTheme } from '@/components/providers/ThemeProvider';
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
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Swap' },
    { href: '/send', label: 'Send' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/orders', label: 'Orders' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `transition-colors font-medium ${
      isActive(href)
        ? 'text-amber-600 dark:text-amber-400 font-semibold'
        : 'text-gray-600 hover:text-gray-900 dark:text-white/80 dark:hover:text-white'
    }`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#0d0d0d]/95 backdrop-blur-xl transition-colors">
      <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1">
          <Image src="/ghost.png" alt="GhostFlow" width={40} height={40} className="rounded-xl" />
          <span className="font-bold text-xl text-gray-900 dark:text-white">GhostFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:text-white/80 dark:hover:bg-white/10 transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              mounted && isConnected
                ? 'bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-900 dark:text-white'
                : 'bg-amber-400 text-black hover:bg-amber-300 font-semibold'
            }`}
          >
            {mounted && isConnected && walletLabel ? (
              <>
                <span className="text-sm font-medium">
                  {walletLabel}
                </span>
                {connectedCount === 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {evmAddress ? 'EVM' : 'Solana'}
                  </span>
                )}
                {connectedCount === 2 && (
                  <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    Both
                  </span>
                )}
              </>
            ) : (
              <span>
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
              <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden py-2">
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-white/50 border-b border-gray-200 dark:border-white/10">
                  For EVM ↔ Solana swaps, connect both
                </div>
                <button
                  onClick={handleConnectEVM}
                  disabled={!!evmAddress}
                  className="w-full px-4 py-2.5 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between disabled:opacity-70 disabled:cursor-default"
                >
                  <span>EVM (MetaMask, etc.)</span>
                  {evmAddress && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">{truncateAddress(evmAddress)} ✓</span>
                  )}
                </button>
                <button
                  onClick={handleConnectSolana}
                  disabled={!!solAddress}
                  className="w-full px-4 py-2.5 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-between disabled:opacity-70 disabled:cursor-default"
                >
                  <span>Solana (Phantom, etc.)</span>
                  {solAddress && (
                    <span className="text-emerald-600 dark:text-emerald-400 text-xs">{truncateAddress(solAddress)} ✓</span>
                  )}
                </button>
                {(evmAddress || solAddress) && (
                  <div className="border-t border-gray-200 dark:border-white/10 pt-2 mt-1">
                    {evmAddress && (
                      <button
                        onClick={() => { disconnectEVM(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100 dark:hover:bg-white/5 text-sm"
                      >
                        Disconnect EVM
                      </button>
                    )}
                    {solAddress && (
                      <button
                        onClick={() => { disconnectSolana(); setShowMenu(false); }}
                        className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100 dark:hover:bg-white/5 text-sm"
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
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden
          />
          <nav
            className="md:hidden fixed top-16 left-0 right-0 z-50 bg-white dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-white/10 py-4 px-4 shadow-xl animate-[fadeIn_0.2s_ease-out]"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-3 rounded-xl ${linkClass(href)}`}
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
