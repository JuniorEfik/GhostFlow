/** Supported USDC tokens across chains - single source of truth */
export const SUPPORTED_USDC_CAIP19 = new Set([
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC Ethereum
  'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // USDC Avalanche
  'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC Base
  'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC Arbitrum (native)
  'eip155:10/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC Optimism (native)
  'eip155:56/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC BSC
  'eip155:137/erc20:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC Polygon (native)
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC Solana
]);

export const SUPPORTED_USDC_LIST = Array.from(SUPPORTED_USDC_CAIP19);

export const DEFAULT_SOURCE = 'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'; // USDC Avalanche
export const DEFAULT_DEST = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC Ethereum
