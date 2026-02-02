# GhostFlow — Presentation Video Brief

> **Purpose:** Give this document to an AI (e.g., video generator, script writer) to create a presentation or demo video for the GhostFlow project.

---

## Project Overview

**GhostFlow** is a cross-chain swap and send platform that enables **private** transfers of digital assets across Ethereum, Avalanche, and Solana.

**Tagline:** *"Swap across chains. Privately."*

**Unique value:** Unlike typical DEXs and bridges, GhostFlow uses [SilentSwap](https://silentswap.com) so the link between sender and recipient is hidden on-chain, improving privacy for cross-chain swaps.

---

## Key Messages for the Video

1. **Privacy-first swaps** — On-chain privacy for cross-chain transactions
2. **Multi-chain** — Ethereum, Avalanche, Solana in one app
3. **Multi-wallet** — Connect EVM (MetaMask, Rabby) and Solana (Phantom, Solflare) at the same time
4. **Simple UX** — Jupiter-style interface: dark theme, amber accents, minimal friction

---

## Main Features to Highlight

### Swap
- Select source token (USDC on Avalanche, Ethereum, or Solana)
- Select destination token (USDC on another chain)
- Enter amount
- See live fee breakdown (service fee, bridge fees, price impact)
- Execute swap with real-time status updates

### Send
- Enter recipient address (EVM or Solana)
- Choose asset to send
- Send cross-chain without exposing sender–recipient link

### Portfolio
- View USDC balances on Avalanche, Ethereum, and Solana
- Total balance in USD

### Orders
- **Pending** — Swaps waiting for deposit or in progress
- **History** — Completed, replaced, or aborted orders
- Status labels: Waiting for deposit, In progress, Completed, Replaced

---

## Design & UI (Jupiter-Inspired)

- **Theme:** Dark (#0d0d0d background, #161616 cards)
- **Accent:** Amber (#f59e0b) for CTAs and highlights
- **Layout:** Centered cards, rounded corners, clean typography
- **Brand:** "GhostFlow" with gradient G logo, amber accent
- **Background:** Subtle radial gradient with amber tones

---

## Suggested Video Structure

### Act 1 — Introduction (0:00–0:30)
- Show GhostFlow logo and tagline
- Briefly state: *"A platform for private cross-chain swaps."*
- Light background music, minimal motion

### Act 2 — Connect Wallet (0:30–1:00)
- Click "Connect" in the header
- Show dual-wallet options: EVM (MetaMask/Rabby) and Solana (Phantom)
- Connect both wallets for full cross-chain support
- Emphasize that both can be connected at once

### Act 3 — Swap Demo (1:00–2:30)
- Start on Swap tab
- Select "You pay": e.g., USDC on Avalanche
- Select "You receive": e.g., USDC on Ethereum
- Enter amount (e.g., $10)
- Show fee breakdown (service fee, bridge fees, price impact, estimated receive)
- Click "Swap"
- Show status: "Fetching quote...", "Executing swap...", steps
- End with "Swap Complete!" and Order ID

### Act 4 — Portfolio & Orders (2:30–3:00)
- Open Portfolio tab — show USDC balances across chains
- Open Orders tab — show pending (if any) and history
- Point out status labels and order IDs

### Act 5 — Send (Optional, 3:00–3:30)
- Switch to Send tab
- Enter recipient address
- Select "They receive" token
- Show that the flow is the same privacy-preserving tech

### Act 6 — Outro (3:30–4:00)
- Return to home
- Final line: *"GhostFlow — private cross-chain swaps on Ethereum, Avalanche, and Solana."*
- Logo + tagline
- Optional: GitHub / docs link

---

## Technical Stack (For Credibility Slide or Voiceover)

- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Privacy:** SilentSwap SDK — SIWE auth, facilitator wallets, hidden links
- **Wallets:** wagmi (EVM), Solana wallet adapter (Phantom, Solflare)
- **Chains:** Ethereum, Avalanche, Solana

---

## Screens to Capture

| Screen      | Route   | What to Show                                      |
|------------|---------|---------------------------------------------------|
| Home/Swap  | `/`     | Swap card, token selectors, fee breakdown, Swap button |
| Send       | `/send` | Recipient input, "They receive" token selector    |
| Portfolio  | `/portfolio` | USDC balances, total USD                     |
| Orders     | `/orders`   | Pending swaps, order history, status labels  |

---

## Voiceover / Script Suggestions

**Opening:**
> "GhostFlow lets you swap and send assets across Ethereum, Avalanche, and Solana — with on-chain privacy. The connection between you and the recipient stays hidden."

**Swap section:**
> "Choose your source and destination, enter an amount, and see real-time fees. One click and the swap executes. You can track progress and history in the Orders tab."

**Closing:**
> "GhostFlow — private cross-chain swaps, powered by SilentSwap."

---

## Assets & Links

- **SilentSwap:** https://silentswap.com
- **Design reference:** Jupiter (jup.ag) — dark theme, amber accents
- **Supported tokens:** USDC on Ethereum, Avalanche, Solana (ingress and egress)

---

## Production Notes for AI

- **Length:** Target 3–4 minutes
- **Tone:** Professional, clear, focused on privacy and ease of use
- **Pacing:** Slow enough to read UI, fast enough to stay engaging
- **Captions:** Consider subtitles for accessibility
- **Resolution:** 1920×1080 or 1280×720
- **Avoid:** Showing API keys, `.env` files, or debug logs
