'use client';

import { useAccount, useWalletClient } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Aggregates addresses from EVM (wagmi) and Solana wallet adapters
 */
export function useUserAddress() {
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const solanaWallet = useWallet();
  const solAddress = solanaWallet.publicKey?.toString();

  return {
    evmAddress: evmAddress ?? undefined,
    solAddress: solAddress ?? undefined,
    bitcoinAddress: undefined as string | undefined, // Bitcoin not yet integrated
    isConnected: evmConnected || !!solanaWallet.publicKey,
    walletClient: walletClient ?? undefined,
  };
}
