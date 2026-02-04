/**
 * Netlify serverless function: EVM RPC proxy.
 * Forwards JSON-RPC requests to chain-specific RPCs with keys from env (never exposed to client).
 * Query param: chainId (e.g. ?chainId=1 for Ethereum).
 * Set ETH_RPC_1, POLYGON_RPC_1, etc. in Netlify env (no NEXT_PUBLIC_ prefix).
 */

const CHAIN_FALLBACKS = {
  1: 'https://ethereum-rpc.publicnode.com',
  43114: 'https://avalanche-c-chain-rpc.publicnode.com',
  8453: 'https://base-rpc.publicnode.com',
  137: 'https://polygon-rpc.com',
  56: 'https://bsc-dataseed.publicnode.com',
  42161: 'https://arbitrum-one-rpc.publicnode.com',
  10: 'https://optimism-rpc.publicnode.com',
};

function getUrlsForChain(chainId) {
  const id = String(chainId);
  const envMap = {
    '1': ['ETH_RPC_1', 'ETH_RPC_2'],
    '43114': ['AVALANCHE_RPC_1', 'AVALANCHE_RPC_2'],
    '8453': ['BASE_RPC_1', 'BASE_RPC_2'],
    '137': ['POLYGON_RPC_1', 'POLYGON_RPC_2'],
    '56': ['BSC_RPC_1', 'BSC_RPC_2'],
    '42161': ['ARBITRUM_RPC_1', 'ARBITRUM_RPC_2'],
    '10': ['OPTIMISM_RPC_1', 'OPTIMISM_RPC_2'],
  };
  const keys = envMap[id] || [];
  const urls = keys.map((k) => process.env[k]).filter(Boolean);
  const fallback = CHAIN_FALLBACKS[Number(chainId)];
  if (fallback) urls.push(fallback);
  return urls.length ? urls : [fallback || 'https://ethereum-rpc.publicnode.com'];
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const chainId = event.queryStringParameters?.chainId || event.multiValueQueryStringParameters?.chainId?.[0];
  if (!chainId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing chainId query parameter' }),
    };
  }

  const urls = getUrlsForChain(chainId);
  const body = event.body;
  const headers = { 'Content-Type': 'application/json' };

  let lastError;
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'All RPC endpoints failed' }),
  };
};
