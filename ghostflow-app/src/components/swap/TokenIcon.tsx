'use client';

import React, { useState } from 'react';
import type { AssetInfo } from '@silentswap/sdk';
import { getTokenDisplayLabel } from '@/lib/tokenDisplay';

const TW_CDN = 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains';

// CAIP2 -> Trust Wallet chain folder (only chains we use for USDC)
const CHAIN_TO_TW: Record<string, string> = {
  'eip155:1': 'ethereum',
  'eip155:43114': 'avalanchec',
  'eip155:56': 'smartchain',
  'eip155:8453': 'base',
  'eip155:10': 'optimism',
  'eip155:42161': 'arbitrum',
  'eip155:137': 'polygon-pos',
};

// Chain badge icons - use when Trust Wallet CDN fails or returns wrong icon
const CHAIN_ICON_OVERRIDES: Record<string, string> = {
  'eip155:137':
    'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'eip155:10':
    'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
};

function getChainInfo(caip19: string): { caip2: string; chainSlug: string; chainIconUrl: string } {
  const slashIdx = caip19.indexOf('/');
  const caip2 = slashIdx > 0 ? caip19.slice(0, slashIdx) : caip19;

  if (caip2.startsWith('solana:')) {
    return {
      caip2,
      chainSlug: 'solana',
      chainIconUrl: `${TW_CDN}/solana/info/logo.png`,
    };
  }
  if (caip2.startsWith('bip122:')) {
    return {
      caip2,
      chainSlug: 'bitcoin',
      chainIconUrl: `${TW_CDN}/bitcoin/info/logo.png`,
    };
  }

  const chainSlug = CHAIN_TO_TW[caip2] ?? `chain-${caip2.replace('eip155:', '')}`;
  const overrideUrl = CHAIN_ICON_OVERRIDES[caip2];
  const twSlug = CHAIN_TO_TW[caip2] ?? 'ethereum';
  return {
    caip2,
    chainSlug,
    chainIconUrl: overrideUrl ?? `${TW_CDN}/${twSlug}/info/logo.png`,
  };
}

// USDC token icons (CoinGecko - app only uses USDC)
const COINGECKO_OVERRIDES: Record<string, string> = {
  // Avalanche USDC (USDC.e) - TW CDN often missing
  'eip155:43114/erc20:0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // Ethereum USDC
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // Base USDC
  'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // Polygon USDC (native)
  'eip155:137/erc20:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // BSC USDC
  'eip155:56/erc20:0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // Arbitrum USDC (native)
  'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // Optimism USDC (native)
  'eip155:10/erc20:0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  // Solana USDC
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v':
    'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
};

function getTokenIconUrls(asset: AssetInfo): string[] {
  const caip19 = asset.caip19;
  const urls: string[] = [];

  const coinGeckoOverride = COINGECKO_OVERRIDES[caip19];
  if (coinGeckoOverride) {
    urls.push(coinGeckoOverride);
  }

  if (caip19.startsWith('solana:')) {
    const tokenMatch = caip19.match(/\/token:([A-Za-z0-9]+)/);
    if (tokenMatch) {
      const mint = tokenMatch[1];
      urls.push(
        `${TW_CDN}/solana/assets/${mint}/logo.png`,
        `https://img.api.jup.ag/solana/${mint}`,
        `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${mint}/logo.png`
      );
    }
  } else if (caip19.startsWith('eip155:')) {
    const parts = caip19.split('/');
    const chainId = parts[0].replace('eip155:', '');
    const twSlug = CHAIN_TO_TW[parts[0]] ?? 'ethereum';
    const addrMatch = caip19.match(/0x[a-fA-F0-9]{40}/);
    if (addrMatch) {
      const addr = addrMatch[0].toLowerCase();
      urls.push(
        `${TW_CDN}/${twSlug}/assets/${addr}/logo.png`,
        `https://tokens.1inch.io/${chainId}/${addrMatch[0]}.png`
      );
      if (twSlug === 'ethereum') {
        urls.push(
          `https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/${addrMatch[0]}/logo.png`
        );
      }
    }
  }

  return urls;
}

function ChainBadge({
  chainIconUrl,
  chainSlug,
}: {
  chainIconUrl: string;
  chainSlug: string;
}) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-800 dark:bg-[#161616] border border-gray-400 dark:border-white/20 flex items-center justify-center overflow-hidden"
      title={chainSlug}
    >
      {!imgError ? (
        <img
          src={chainIconUrl}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-700 dark:text-white/80 bg-gray-200 dark:bg-white/10"
          style={{ lineHeight: 1 }}
        >
          {chainSlug.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  );
}

interface TokenIconProps {
  asset: AssetInfo;
  size?: number;
  showChainBadge?: boolean;
  className?: string;
}

export function TokenIcon({
  asset,
  size = 40,
  showChainBadge = true,
  className = '',
}: TokenIconProps) {
  const [imgError, setImgError] = useState(false);
  const [urlIndex, setUrlIndex] = useState(0);
  const urls = getTokenIconUrls(asset);
  const currentUrl = urls[urlIndex] ?? null;
  const { chainIconUrl } = getChainInfo(asset.caip19);

  const handleImgError = () => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex((i) => i + 1);
    } else {
      setImgError(true);
    }
  };

  const useImg = currentUrl && !imgError;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: useImg
            ? undefined
            : `linear-gradient(135deg, ${asset.gradient[0]}, ${asset.gradient[1]})`,
        }}
      >
        {useImg && (
          <img
            src={currentUrl}
            alt={getTokenDisplayLabel(asset)}
            className="w-full h-full object-cover"
            onError={handleImgError}
          />
        )}
      </div>
      {showChainBadge && (
        <ChainBadge chainIconUrl={chainIconUrl} chainSlug={getChainInfo(asset.caip19).chainSlug} />
      )}
    </div>
  );
}
