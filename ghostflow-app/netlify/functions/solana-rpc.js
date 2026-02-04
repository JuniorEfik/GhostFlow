/**
 * Netlify serverless function: Solana RPC proxy.
 * Forwards requests to Helius/Zan/Lava with API keys from env (never exposed to client).
 * Set HELIUS_API_KEY, ZAN_SOLANA_KEY, LAVA_SOLANA_KEY in Netlify env.
 */

const UPSTREAMS = [
  process.env.HELIUS_API_KEY && `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
  process.env.ZAN_SOLANA_KEY && `https://api.zan.top/node/v1/solana/mainnet/${process.env.ZAN_SOLANA_KEY}`,
  process.env.LAVA_SOLANA_KEY && `https://g.w.lavanet.xyz:443/gateway/solana/rpc-http/${process.env.LAVA_SOLANA_KEY}`,
].filter(Boolean);

const FALLBACK = 'https://solana-rpc.publicnode.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const urls = UPSTREAMS.length > 0 ? [...UPSTREAMS, FALLBACK] : [FALLBACK];
  const body = event.body;
  const headers = { 'Content-Type': 'application/json' };

  let lastError;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
      });
      if (res.status === 429 || res.status >= 500) {
        lastError = res;
        continue;
      }
      const data = await res.text();
      return {
        statusCode: res.status,
        headers: { 'Content-Type': 'application/json' },
        body: data,
      };
    } catch (e) {
      lastError = e;
      continue;
    }
  }

  return {
    statusCode: 503,
    body: JSON.stringify({ error: 'All RPC endpoints failed' }),
    headers: { 'Content-Type': 'application/json' },
  };
};
