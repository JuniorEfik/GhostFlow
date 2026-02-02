# GhostFlow

Cross-chain swap and send platform for digital assets across multiple blockchains. Built with [SilentSwap SDK](https://silentswap.com) for private, cross-chain transactions.

## Features

- **Cross-Chain Swaps**: Swap assets between Ethereum, Avalanche, Solana, and more
- **Send Assets**: Send tokens to any wallet address across chains
- **Privacy-Focused**: Uses SilentSwap for private transaction flows
- **Multi-Wallet**: Connect EVM (MetaMask, etc.) and Solana (Phantom, etc.) wallets

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS
- **SDK**: @silentswap/react, @silentswap/sdk
- **Wallets**: wagmi (EVM), @solana/wallet-adapter (Solana)

## Getting Started

```bash
cd ghostflow-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Environment

Create `.env.local` for optional overrides:

```env
# Solana RPC - default uses PublicNode (avoids 403 from official endpoint)
NEXT_PUBLIC_SOLANA_RPC=https://solana-rpc.publicnode.com
# For production, use Helius/QuickNode/etc. with API key for better reliability
# NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_INTEGRATOR_ID=your-integrator-id  # Optional: for SilentSwap tracking
```

## Project Structure

```
GhostFlow/
├── code.md           # SDK documentation reference
├── README.md
└── ghostflow-app/    # Next.js application
    ├── src/
    │   ├── app/           # App router pages
    │   ├── components/    # React components
    │   ├── hooks/         # Custom hooks (useUserAddress)
    │   └── lib/           # Config (wagmi)
```

## SDK Reference

The implementation follows the SilentSwap React integration as documented in `code.md`. Key hooks used:

- `SilentSwapProvider` - Auth, wallet, quoting, order tracking
- `useSilentSwap` - Execute swaps, track orders, fees
- `useSwap` - Form state (tokens, amounts, destinations)
- `useBalancesContext` - Cross-chain balances
- `useOrdersContext` - Swap history
