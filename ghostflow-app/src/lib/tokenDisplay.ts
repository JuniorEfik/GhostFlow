/** USDC (chain) for tokens with chain badge; always capitalize symbol */
export function getTokenDisplayLabel(asset: { caip19: string; symbol: string }): string {
  const symbol = (asset.symbol || 'USDC').toUpperCase();
  if (symbol !== 'USDC') return symbol;
  const chain = asset.caip19.split('/')[0] || '';
  const chainNames: Record<string, string> = {
    'eip155:1': 'Ethereum',
    'eip155:43114': 'Avalanche',
    'eip155:56': 'BSC',
    'eip155:8453': 'Base',
    'eip155:10': 'Optimism',
    'eip155:42161': 'Arbitrum',
    'eip155:137': 'Polygon',
  };
  if (chain.startsWith('solana')) return 'USDC (Solana)';
  const name = chainNames[chain];
  return name ? `USDC (${name})` : 'USDC';
}
