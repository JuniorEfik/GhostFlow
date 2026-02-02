'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount, useWalletClient } from 'wagmi';
import { getWalletClient } from 'wagmi/actions';
import { config } from '@/lib/wagmi-config';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react';
import { SilentSwapProvider, useSolanaAdapter } from '@silentswap/react';
import { createSilentSwapClient, ENVIRONMENT } from '@silentswap/sdk';
import { useUserAddress } from '@/hooks/useUserAddress';

import '@solana/wallet-adapter-react-ui/styles.css';

const queryClient = new QueryClient();

const environment = ENVIRONMENT.MAINNET;
const client = createSilentSwapClient({ environment });

function SilentSwapWrapper({ children }: { children: React.ReactNode }) {
  const { isConnected, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { evmAddress, solAddress, bitcoinAddress } = useUserAddress();
  const { solanaConnector, solanaConnectionAdapter } = useSolanaAdapter();
  const [fetchedClient, setFetchedClient] = useState<Awaited<ReturnType<typeof getWalletClient>> | null>(null);

  useEffect(() => {
    if (walletClient) {
      setFetchedClient(null);
      return;
    }
    if (!connector || !evmAddress) {
      setFetchedClient(null);
      return;
    }
    let cancelled = false;
    getWalletClient(config, { connector })
      .then((wc) => {
        if (!cancelled) setFetchedClient(wc ?? null);
      })
      .catch(() => {
        if (!cancelled) setFetchedClient(null);
      });
    return () => { cancelled = true; };
  }, [connector, evmAddress, walletClient]);

  const effectiveWalletClient = walletClient ?? fetchedClient;

  return (
    <SilentSwapProvider
      client={client}
      environment={environment}
      evmAddress={evmAddress}
      solAddress={solAddress}
      bitcoinAddress={bitcoinAddress}
      isConnected={isConnected}
      connector={connector as any}
      walletClient={effectiveWalletClient as any}
      solanaConnector={solanaConnector}
      solanaConnection={solanaConnectionAdapter}
      solanaRpcUrl={process.env.NEXT_PUBLIC_SOLANA_RPC ?? 'https://solana-rpc.publicnode.com'}
    >
      {children}
    </SilentSwapProvider>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <ConnectionProvider
          endpoint={process.env.NEXT_PUBLIC_SOLANA_RPC ?? 'https://solana-rpc.publicnode.com'}
        >
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <SilentSwapWrapper>{children}</SilentSwapWrapper>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
