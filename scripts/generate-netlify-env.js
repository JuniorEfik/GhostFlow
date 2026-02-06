#!/usr/bin/env node
/**
 * Generates .env.netlify from ghostflow-app/.env.local for proxy mode.
 * Run: node scripts/generate-netlify-env.js
 * Then: netlify env:import .env.netlify
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '../ghostflow-app/.env.local');
const outPath = path.join(__dirname, '../.env.netlify');

if (!fs.existsSync(envLocalPath)) {
  console.error('ghostflow-app/.env.local not found');
  process.exit(1);
}

const raw = fs.readFileSync(envLocalPath, 'utf8');
const vars = {};
for (const line of raw.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) vars[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

function extractHeliusKey(url) {
  const m = (url || '').match(/api-key=([^&]+)/);
  return m ? m[1] : '';
}
function extractPathKey(url) {
  const parts = (url || '').split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

const out = [
  'NEXT_PUBLIC_SOLANA_USE_PROXY=true',
  'NEXT_PUBLIC_USE_EVM_PROXY=true',
  `NEXT_PUBLIC_SITE_URL=${(vars.NEXT_PUBLIC_SITE_URL || 'https://apokolipzz-ghostflow.netlify.app').replace(/\/$/, '')}`,
  `NEXT_PUBLIC_ENVIRONMENT=${vars.NEXT_PUBLIC_ENVIRONMENT || 'STAGING'}`,
  '',
  `HELIUS_API_KEY=${extractHeliusKey(vars.NEXT_PUBLIC_SOLANA_RPC)}`,
  `ZAN_SOLANA_KEY=${extractPathKey(vars.NEXT_PUBLIC_SOLANA_RPC_2)}`,
  `LAVA_SOLANA_KEY=${extractPathKey(vars.NEXT_PUBLIC_SOLANA_RPC_3)}`,
  '',
  `ETH_RPC_1=${vars.NEXT_PUBLIC_ETH_RPC_1 || ''}`,
  `ETH_RPC_2=${vars.NEXT_PUBLIC_ETH_RPC_2 || ''}`,
  `POLYGON_RPC_1=${vars.NEXT_PUBLIC_POLYGON_RPC_1 || ''}`,
  `POLYGON_RPC_2=${vars.NEXT_PUBLIC_POLYGON_RPC_2 || ''}`,
  `AVALANCHE_RPC_1=${vars.NEXT_PUBLIC_AVALANCHE_RPC_1 || ''}`,
  `AVALANCHE_RPC_2=${vars.NEXT_PUBLIC_AVALANCHE_RPC_2 || ''}`,
  `BASE_RPC_1=${vars.NEXT_PUBLIC_BASE_RPC_1 || ''}`,
  `BASE_RPC_2=${vars.NEXT_PUBLIC_BASE_RPC_2 || ''}`,
  `ARBITRUM_RPC_1=${vars.NEXT_PUBLIC_ARBITRUM_RPC_1 || ''}`,
  `ARBITRUM_RPC_2=${vars.NEXT_PUBLIC_ARBITRUM_RPC_2 || ''}`,
  `OPTIMISM_RPC_1=${vars.NEXT_PUBLIC_OPTIMISM_RPC_1 || ''}`,
  `OPTIMISM_RPC_2=${vars.NEXT_PUBLIC_OPTIMISM_RPC_2 || ''}`,
  `BSC_RPC_1=${vars.NEXT_PUBLIC_BSC_RPC_1 || ''}`,
  `BSC_RPC_2=${vars.NEXT_PUBLIC_BSC_RPC_2 || ''}`,
].join('\n');

fs.writeFileSync(outPath, out);
console.log('Wrote .env.netlify. Run: netlify env:import .env.netlify');
