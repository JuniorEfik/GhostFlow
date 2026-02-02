'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useOrdersContext,
  useSilentSwap,
  useOrderTracking,
  type OrdersContextOrder,
  type OrdersContextType,
} from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

const PENDING_STATUSES = new Set(['INIT', 'IN_PROGRESS']);
const SUCCESS_STATUS = 'COMPLETE';

// USDC uses 6 decimals on all chains (Ethereum, Avalanche, Solana)
const USDC_DECIMALS = 6;

// Block explorer URLs - Solana uses base58 tx signatures (solscan.io/tx/5VJLkyY5...)
const SOLANA_CHAIN_IDS = new Set(['7565164', '792703809']); // deBridge, relay

/** SilentSwap API returns hex for Solana txs; Solscan needs base58. code.md has no API for base58. */
function isHexFormat(txId: string): boolean {
  const s = String(txId).trim();
  return (s.startsWith('0x') && /^0x[0-9a-fA-F]+$/.test(s)) || /^[0-9a-fA-F]{64,128}$/.test(s);
}

function getExplorerTxUrl(
  chain: string,
  txId: string
): { url: string; isSolanaHex?: boolean } {
  if (!chain || !txId) return { url: '' };
  const c = String(chain).toLowerCase();
  const isSolana = c.includes('solana') || SOLANA_CHAIN_IDS.has(String(chain));
  const sig = String(txId).trim();

  if (c.includes('eip155:1') || c === '1' || c.includes('ethereum')) {
    return { url: `https://etherscan.io/tx/${sig}` };
  }
  if (c.includes('eip155:43114') || c === '43114' || c.includes('avalanche')) {
    return { url: `https://snowtrace.io/tx/${sig}` };
  }
  if (isSolana) {
    if (isHexFormat(sig)) {
      return { url: '', isSolanaHex: true };
    }
    return { url: `https://solscan.io/tx/${sig}` };
  }
  return { url: '' };
}

function formatUsdcAmount(rawAmount: string | undefined): string {
  if (rawAmount == null || rawAmount === '?' || rawAmount === '') return '—';
  try {
    const num = parseFloat(rawAmount);
    if (isNaN(num)) return '—';
    const human = num / Math.pow(10, USDC_DECIMALS);
    if (human === 0) return '0';
    return human >= 1
      ? human.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : human.toFixed(2);
  } catch {
    return '—';
  }
}

function OrderTxLinks({
  orderId,
  auth,
  sourceCaip19,
  onClose,
}: {
  orderId: string;
  auth: string;
  sourceCaip19: string;
  onClose: () => void;
}) {
  const { client } = useSilentSwap();
  const { deposit, outputs, isLoading } = useOrderTracking({
    client,
    orderId,
    viewingAuth: auth,
  });

  const depositResult =
    deposit?.tx && sourceCaip19
      ? getExplorerTxUrl(
          sourceCaip19.startsWith('solana') ? 'solana' : sourceCaip19.split('/')[0],
          deposit.tx
        )
      : { url: '', isSolanaHex: false };

  const receiptLinks = outputs
    .map((o) => o.txs?.RECEIPT)
    .filter(Boolean)
    .map((r) =>
      r && r.txId
        ? { label: 'Receive tx' as const, ...getExplorerTxUrl(r.chain, r.txId), chain: r.chain }
        : null
    )
    .filter(Boolean) as { label: 'Receive tx'; url: string; isSolanaHex?: boolean; chain: string }[];

  const hasAnyLink = depositResult.url || receiptLinks.some((r) => r.url);
  const hasSolanaHex =
    depositResult.isSolanaHex || receiptLinks.some((r) => r.isSolanaHex);

  if (isLoading && !deposit && receiptLinks.length === 0) {
    return (
      <div className="mt-2 text-xs text-white/50">Loading transaction links...</div>
    );
  }
  if (!hasAnyLink && !hasSolanaHex) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      {depositResult.url && (
        <a
          href={depositResult.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-400 hover:text-amber-300 underline"
        >
          Deposit tx
        </a>
      )}
      {depositResult.isSolanaHex && (
        <span className="text-white/40">Deposit tx (hex format, link unavailable)</span>
      )}
      {receiptLinks.map((r, i) =>
        r.url ? (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline"
          >
            Receive tx
          </a>
        ) : r.isSolanaHex ? (
          <span key={i} className="text-white/40">
            Receive tx (hex format, link unavailable)
          </span>
        ) : null
      )}
      <button
        type="button"
        onClick={onClose}
        className="text-white/50 hover:text-white/70"
      >
        Hide
      </button>
    </div>
  );
}

function OrderRow({
  order,
  getOrderAgeText,
  getStatusInfo,
  orderIdToViewingAuth,
  selectedOrderId,
  onSelectOrder,
}: {
  order: OrdersContextOrder;
  getOrderAgeText: (modified?: number) => string;
  getStatusInfo: OrdersContextType['getStatusInfo'];
  orderIdToViewingAuth: Record<string, string>;
  selectedOrderId: string | null;
  onSelectOrder: (id: string | null) => void;
}) {
  const statusInfo = getStatusInfo(order.status);
  const isPending = PENDING_STATUSES.has(order.status);
  const isSuccess = order.status === SUCCESS_STATUS;
  const isSelected = selectedOrderId === order.orderId;
  const auth = order.auth ?? orderIdToViewingAuth[order.orderId];

  const caip19 = order.metadata?.sourceAsset?.caip19 ?? '';
  const rawAmount = order.metadata?.sourceAsset?.amount;
  const amountFormatted = formatUsdcAmount(rawAmount);
  const chainLabel = caip19.includes('43114') ? 'USDC (AVAX)' : caip19.includes('solana') ? 'USDC (SOL)' : caip19.includes('1/') ? 'USDC (ETH)' : 'USDC';
  const sourceLabel = order.metadata?.sourceAsset ? `${amountFormatted} ${chainLabel}` : '—';

  const handleIdClick = () => {
    if (isSuccess && auth) {
      onSelectOrder(isSelected ? null : order.orderId);
    }
  };

  return (
    <div
      className={`flex flex-col p-4 rounded-xl border transition-colors ${
        isPending
          ? 'bg-amber-500/5 border-amber-500/20'
          : isSuccess
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              isPending
                ? 'bg-amber-400 animate-pulse'
                : isSuccess
                ? 'bg-emerald-400'
                : 'bg-white/40'
            }`}
          />
          <div className="min-w-0">
            <button
              type="button"
              onClick={handleIdClick}
              className={`font-medium truncate text-left block w-full ${
                isSuccess && auth
                  ? 'text-amber-400 hover:text-amber-300 cursor-pointer underline'
                  : 'text-white cursor-default'
              }`}
            >
              {order.orderId.slice(0, 12)}...
            </button>
            <div className="text-sm text-white/50 truncate">{sourceLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          <span className="text-xs text-white/40">{getOrderAgeText(order.modified)}</span>
        </div>
      </div>
      {isSuccess && isSelected && auth && (
        <OrderTxLinks
          orderId={order.orderId}
          auth={auth}
          sourceCaip19={caip19}
          onClose={() => onSelectOrder(null)}
        />
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { isConnected } = useUserAddress();
  const {
    orders,
    loading,
    refreshOrders,
    getOrderAgeText,
    getStatusInfo,
    orderIdToViewingAuth,
  } = useOrdersContext();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const pendingOrders = orders.filter((o) => PENDING_STATUSES.has(o.status));
  const historyOrders = orders.filter((o) => !PENDING_STATUSES.has(o.status));

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Orders</h1>
          <p className="text-white/60 mb-8">
            Connect your wallet to view pending swaps and order history
          </p>
          <div className="rounded-2xl bg-[#161616] border border-white/10 p-12 text-center">
            <p className="text-white/50">Connect EVM or Solana wallet from the header</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
        <p className="text-white/60">
          Pending swaps and order history
        </p>
      </div>

      {loading && orders.length === 0 ? (
        <div className="rounded-2xl bg-[#161616] border border-white/10 p-12 text-center">
          <div className="animate-pulse text-white/60">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-[#161616] border border-white/10 p-12 text-center">
          <p className="text-white/50 mb-4">No orders yet</p>
          <p className="text-sm text-white/40 mb-6">
            Complete a swap to see pending and completed orders here
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl bg-amber-400 text-black font-semibold hover:bg-amber-300 transition-colors"
          >
            Swap now
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {pendingOrders.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Pending ({pendingOrders.length})
              </h2>
              <div className="space-y-2">
                {pendingOrders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    getOrderAgeText={getOrderAgeText}
                    getStatusInfo={getStatusInfo}
                    orderIdToViewingAuth={orderIdToViewingAuth}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                  />
                ))}
              </div>
            </section>
          )}

          {historyOrders.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">History</h2>
              <div className="space-y-2">
                {historyOrders.map((order) => (
                  <OrderRow
                    key={order.orderId}
                    order={order}
                    getOrderAgeText={getOrderAgeText}
                    getStatusInfo={getStatusInfo}
                    orderIdToViewingAuth={orderIdToViewingAuth}
                    selectedOrderId={selectedOrderId}
                    onSelectOrder={setSelectedOrderId}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <button
          onClick={() => refreshOrders()}
          className="mt-6 w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
        >
          Refresh
        </button>
      )}
    </div>
  );
}
