/**
 * Solana RPC with fallback support.
 * When NEXT_PUBLIC_SOLANA_USE_PROXY=true, uses server proxy (no API keys in client).
 * Otherwise tries each URL in order; on 429, 5xx, or network error, falls back to the next.
 */

const DEFAULT_SOLANA_RPC = 'https://solana-rpc.publicnode.com';

export function getSolanaRpcUrls(): string[] {
  const useProxy = process.env.NEXT_PUBLIC_SOLANA_USE_PROXY === 'true';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (useProxy && siteUrl) {
    return [`${siteUrl}/.netlify/functions/solana-rpc`];
  }

  const urls: string[] = [];
  const primary = process.env.NEXT_PUBLIC_SOLANA_RPC ?? process.env.NEXT_PUBLIC_SOLANA_RPC_1;
  if (primary) urls.push(primary);
  const rpc2 = process.env.NEXT_PUBLIC_SOLANA_RPC_2;
  if (rpc2) urls.push(rpc2);
  const rpc3 = process.env.NEXT_PUBLIC_SOLANA_RPC_3;
  if (rpc3) urls.push(rpc3);
  if (urls.length === 0) urls.push(DEFAULT_SOLANA_RPC);
  return urls;
}

/**
 * Creates a fetch that tries each RPC URL in order on failure (429, 5xx, or network error).
 */
export function createSolanaFallbackFetch(urls: string[]): typeof fetch {
  if (urls.length <= 1) {
    return fetch.bind(globalThis);
  }

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let lastError: unknown;
    for (let i = 0; i < urls.length; i++) {
      const target = i === 0 ? input : urls[i];
      try {
        const res = await fetch(target, init);
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          lastError = new Error(`RPC returned ${res.status}`);
          continue;
        }
        return res;
      } catch (e) {
        lastError = e;
        continue;
      }
    }
    throw lastError ?? new Error('All Solana RPC endpoints failed');
  };
}
