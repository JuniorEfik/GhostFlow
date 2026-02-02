import { createConfig, http, injected } from 'wagmi';
import { mainnet, avalanche } from 'viem/chains';

export const config = createConfig({
  chains: [mainnet, avalanche],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
  },
  connectors: [injected()],
});
