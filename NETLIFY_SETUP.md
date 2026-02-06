# Netlify Setup: Linking + Proxy Functions

## Step 1: Connect repo to Netlify

### Option A: New site (connect from Netlify Dashboard)

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** (or GitLab/Bitbucket)
3. Select your **GhostFlow** repo
4. Netlify will read `netlify.toml` automatically. Verify:
   - **Base directory:** `ghostflow-app`
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
   - **Functions directory:** `netlify/functions`

5. Click **Deploy site** (it may fail until env vars are set – that’s okay)

### Option B: Existing site (link via CLI)

```bash
cd /home/apokolipzz/GhostFlow
netlify link
# Choose: Use current Git remote
# Select your GhostFlow site
```

---

## Step 2: Add environment variables

In Netlify: **Site settings** → **Environment variables** → **Add a variable** (or **Import from .env**).

### Client-side (used at build time)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SOLANA_USE_PROXY` | `true` |
| `NEXT_PUBLIC_USE_EVM_PROXY` | `true` |
| `NEXT_PUBLIC_SITE_URL` | `https://apokolipzz-ghostflow.netlify.app` |
| `NEXT_PUBLIC_ENVIRONMENT` | `STAGING` |

### Server-side only (no `NEXT_PUBLIC_` – never exposed)

Copy from your `.env.local` (full URLs):

| Key | Example |
|-----|---------|
| `HELIUS_API_KEY` | `3a322950-c215-452d-aec1-218610eba1c6` |
| `ZAN_SOLANA_KEY` | `8c8cbf1181ac4eb9af689232b760ad24` |
| `LAVA_SOLANA_KEY` | `ee7bdfa0b45c6e7f4fe3da19cfe8ea14` |
| `ETH_RPC_1` | `https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `ETH_RPC_2` | `https://api.zan.top/node/v1/eth/mainnet/YOUR_KEY` |
| `POLYGON_RPC_1` | `https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `POLYGON_RPC_2` | `https://api.zan.top/node/v1/polygon/mainnet/YOUR_KEY` |
| `AVALANCHE_RPC_1` | *(optional – falls back to public)* |
| `AVALANCHE_RPC_2` | *(optional)* |
| `BASE_RPC_1` | `https://base-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `BASE_RPC_2` | `https://api.zan.top/node/v1/base/mainnet/YOUR_KEY` |
| `ARBITRUM_RPC_1` | `https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `ARBITRUM_RPC_2` | `https://api.zan.top/node/v1/arb/one/YOUR_KEY` |
| `OPTIMISM_RPC_1` | `https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY` |
| `OPTIMISM_RPC_2` | `https://api.zan.top/node/v1/opt/mainnet/YOUR_KEY` |
| `BSC_RPC_1` | `https://api.zan.top/node/v1/bsc/mainnet/YOUR_KEY` |
| `BSC_RPC_2` | `https://g.w.lavanet.xyz:443/gateway/bsc/rpc-http/YOUR_KEY` |

Use the **full RPC URLs** from your `.env.local`; the proxy forwards requests as-is.

---

## Step 3: Redeploy

After saving env vars:

- **Dashboard:** **Deploys** → **Trigger deploy** → **Deploy site**
- **CLI:** `netlify deploy --prod`

---

## Step 4: Verify functions

Once deployed:

- Solana proxy: `https://apokolipzz-ghostflow.netlify.app/.netlify/functions/solana-rpc`
- EVM proxy: `https://apokolipzz-ghostflow.netlify.app/.netlify/functions/evm-rpc?chainId=1`

These URLs should respond to `POST` (they may return 405 for `GET`, which is expected).
