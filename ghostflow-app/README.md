# GhostFlow App

Next.js application for cross-chain USDC swap and send. Built with SilentSwap SDK, wagmi, and Solana wallet adapters.

## Quick Start

```bash
npm install
cp .env.example .env.local   # Then edit with your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Development

```bash
npm run dev
```

Starts the Next.js dev server at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local` with the following. **All `NEXT_PUBLIC_*` vars are required at build time** (they are inlined into the client bundle).

```env
# Required
NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
NEXT_PUBLIC_ENVIRONMENT=STAGING   # or MAINNET

# EVM RPC URLs (optional – wagmi falls back to public RPCs if missing)
# Polygon
NEXT_PUBLIC_POLYGON_RPC_1=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_POLYGON_RPC_2=https://api.zan.top/node/v1/polygon/mainnet/YOUR_KEY

# Ethereum
NEXT_PUBLIC_ETH_RPC_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ETH_RPC_2=https://api.zan.top/node/v1/eth/mainnet/YOUR_KEY

# Arbitrum
NEXT_PUBLIC_ARBITRUM_RPC_1=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ARBITRUM_RPC_2=https://api.zan.top/node/v1/arb/one/YOUR_KEY

# Optimism
NEXT_PUBLIC_OPTIMISM_RPC_1=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_OPTIMISM_RPC_2=https://api.zan.top/node/v1/opt/mainnet/YOUR_KEY

# Base
NEXT_PUBLIC_BASE_RPC_1=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_BASE_RPC_2=https://api.zan.top/node/v1/base/mainnet/YOUR_KEY

# BSC
NEXT_PUBLIC_BSC_RPC_1=https://api.zan.top/node/v1/bsc/mainnet/YOUR_KEY
NEXT_PUBLIC_BSC_RPC_2=https://g.w.lavanet.xyz:443/gateway/bsc/rpc-http/YOUR_KEY
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout, theme script, metadata (OG/Twitter)
│   ├── page.tsx            # Home (Swap)
│   ├── swap/page.tsx
│   ├── send/page.tsx
│   ├── portfolio/page.tsx
│   ├── orders/page.tsx
│   ├── error.tsx           # Error boundary
│   └── not-found.tsx       # 404 page
├── components/
│   ├── header/Header.tsx   # Nav, wallet menu, theme toggle, mobile menu
│   ├── layout/SwapPageLayout.tsx
│   ├── providers/          # ThemeProvider, AppProviders, BalanceAutoRefresher
│   └── swap/               # SwapCard, TokenSelector, popups, TokenIcon
├── hooks/useUserAddress.ts # Aggregates EVM + Solana addresses
└── lib/
    ├── constants.ts        # SUPPORTED_USDC_CAIP19, DEFAULT_SOURCE, DEFAULT_DEST
    ├── tokenDisplay.ts     # getTokenDisplayLabel
    └── wagmi-config.ts     # wagmi + viem fallback RPC transports
```

## Important Implementation Notes

### Single source of truth for USDC

- **`src/lib/constants.ts`** defines `SUPPORTED_USDC_CAIP19`, `SUPPORTED_USDC_LIST`, `DEFAULT_SOURCE`, `DEFAULT_DEST`.
- Import from here in SwapCard, TokenSelector, Portfolio, Orders. Do not redefine these lists elsewhere.

### Hydration safety

- Wallet-dependent and theme-dependent UI can differ between server and client. Use a **mounted pattern**:
  - `const [mounted, setMounted] = useState(false)` and `useEffect(() => setMounted(true), [])`.
  - Show a stable placeholder until `mounted` is true, then render real content.
- Used in: SwapCard, Header, Portfolio, Orders.

### Avoid calling `getPrice()` during render

- `usePricesContext().getPrice()` can update PricesProvider state.
- Compute `inputUsd` in `useEffect` and store in state instead of calling `getPrice()` directly in render.

### Navigation

- Use Next.js `<Link>` for internal routes so navigation stays client-side.
- Active route styling uses `usePathname()` in the Header.

### Theme

- Theme is stored in `localStorage` under `ghostflow-theme`.
- An inline script in `layout.tsx` sets the `dark` class before paint to avoid flash.
- `ThemeProvider` syncs theme with the DOM; `useLayoutEffect` runs before paint.

## Build & Deploy

```bash
npm run build
```

Output: static export in `out/`. The app uses `output: 'export'` for static hosting.

For Netlify drag-and-drop: build with `.env.local` present, then copy `out/` into the deploy folder. See root `README.md` and `netlify-deploy/NETLIFY_ENV_REFERENCE.md`.

## SDK Reference

Main pieces:

- **SilentSwapProvider** – auth, wallet, quoting, order tracking
- **useSilentSwap** – swap execution, fees, loading
- **useSwap** – form state (tokens, amounts, destinations)
- **useBalancesContext** – balances (refreshed every 5s on swap/send, 30s on portfolio)
- **useOrdersContext** – pending and historical orders

## Supported Chains

USDC on: Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon, Solana.
