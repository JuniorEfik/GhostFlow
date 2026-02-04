import { createConfig, http, injected } from 'wagmi';
import { fallback } from 'viem';
import { mainnet, avalanche, base, polygon, bsc, arbitrum, optimism } from 'viem/chains';

function transportWithFallback(urls: (string | undefined)[], defaultHttp: ReturnType<typeof http>) {
  const valid = urls.filter((u): u is string => !!u);
  if (valid.length === 0) return defaultHttp;
  return fallback([...valid.map((u) => http(u)), defaultHttp]);
}

export const config = createConfig({
  chains: [mainnet, avalanche, base, polygon, bsc, arbitrum, optimism],
  transports: {
    [mainnet.id]: transportWithFallback(
      [process.env.NEXT_PUBLIC_ETH_RPC_1, process.env.NEXT_PUBLIC_ETH_RPC_2],
      http()
    ),
    [avalanche.id]: http(),
    [base.id]: transportWithFallback(
      [process.env.NEXT_PUBLIC_BASE_RPC_1, process.env.NEXT_PUBLIC_BASE_RPC_2],
      http()
    ),
    [polygon.id]: transportWithFallback(
      [process.env.NEXT_PUBLIC_POLYGON_RPC_1, process.env.NEXT_PUBLIC_POLYGON_RPC_2],
      http()
    ),
    [bsc.id]: transportWithFallback(
      [process.env.NEXT_PUBLIC_BSC_RPC_1, process.env.NEXT_PUBLIC_BSC_RPC_2],
      http()
    ),
    [arbitrum.id]: transportWithFallback(
      [process.env.NEXT_PUBLIC_ARBITRUM_RPC_1, process.env.NEXT_PUBLIC_ARBITRUM_RPC_2],
      http()
    ),
    [optimism.id]: transportWithFallback(
      [process.env.NEXT_PUBLIC_OPTIMISM_RPC_1, process.env.NEXT_PUBLIC_OPTIMISM_RPC_2],
      http()
    ),
  },
  connectors: [injected()],
});
