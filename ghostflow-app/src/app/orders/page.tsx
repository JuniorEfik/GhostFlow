'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTokenDisplayLabel } from '@/lib/tokenDisplay';
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

// USDC decimals by chain - BSC uses 18, others use 6
const USDC_DECIMALS_BY_CHAIN: Record<string, number> = {
  'eip155:56': 18, // BSC USDC
};
const DEFAULT_USDC_DECIMALS = 6;

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
  if (c.includes('eip155:8453') || c === '8453' || c.includes('base')) {
    return { url: `https://basescan.org/tx/${sig}` };
  }
  if (c.includes('eip155:137') || c === '137' || c.includes('polygon')) {
    return { url: `https://polygonscan.com/tx/${sig}` };
  }
  if (c.includes('eip155:56') || c === '56' || c.includes('bsc') || c.includes('binance')) {
    return { url: `https://bscscan.com/tx/${sig}` };
  }
  if (c.includes('eip155:42161') || c === '42161' || c.includes('arbitrum')) {
    return { url: `https://arbiscan.io/tx/${sig}` };
  }
  if (c.includes('eip155:10') || c === '10' || c.includes('optimism')) {
    return { url: `https://optimistic.etherscan.io/tx/${sig}` };
  }
  if (isSolana) {
    if (isHexFormat(sig)) {
      return { url: '', isSolanaHex: true };
    }
    return { url: `https://solscan.io/tx/${sig}` };
  }
  return { url: '' };
}

function getUsdcDecimals(caip19: string): number {
  const chain = caip19.split('/')[0] || '';
  return USDC_DECIMALS_BY_CHAIN[chain] ?? DEFAULT_USDC_DECIMALS;
}

function formatDuration(ms: number): string {
  if (ms < 0 || !Number.isFinite(ms)) return '—';
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const s = sec % 60;
  if (min < 60) return s > 0 ? `${min}m ${s}s` : `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function useElapsedMs(startTimestamp: number | undefined): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTimestamp || startTimestamp <= 0) {
      setElapsed(0);
      return;
    }
    const update = () => setElapsed(Date.now() - startTimestamp);
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTimestamp]);
  return elapsed;
}

function formatUsdcAmount(rawAmount: string | undefined, caip19?: string): string {
  if (rawAmount == null || rawAmount === '?' || rawAmount === '') return '—';
  try {
    const num = parseFloat(rawAmount);
    if (isNaN(num)) return '—';
    const decimals = caip19 ? getUsdcDecimals(caip19) : DEFAULT_USDC_DECIMALS;
    const human = num / Math.pow(10, decimals);
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
      <div className="mt-2 text-xs text-gray-500 dark:text-white/50">Loading transaction links...</div>
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
          className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline"
        >
          Deposit tx
        </a>
      )}
      {depositResult.isSolanaHex && (
        <span className="text-gray-500 dark:text-white/40">Deposit tx (hex format, link unavailable)</span>
      )}
      {receiptLinks.map((r, i) =>
        r.url ? (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline"
          >
            Receive tx
          </a>
        ) : r.isSolanaHex ? (
          <span key={i} className="text-gray-500 dark:text-white/40">
            Receive tx (hex format, link unavailable)
          </span>
        ) : null
      )}
      <button
        type="button"
        onClick={onClose}
        className="text-gray-600 dark:text-white/50 hover:text-gray-800 dark:hover:text-white/70"
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

  const startTs = order.deposit?.timestamp ?? order.modified;
  const elapsedMs = useElapsedMs(isPending ? startTs : undefined);
  const completedDurationMs =
    isSuccess && order.modified && order.deposit?.timestamp
      ? order.modified - order.deposit.timestamp
      : 0;

  const caip19 = order.metadata?.sourceAsset?.caip19 ?? '';
  const rawAmount = order.metadata?.sourceAsset?.amount;
  const amountFormatted = formatUsdcAmount(rawAmount, caip19);
  const chainLabel = getTokenDisplayLabel({ caip19, symbol: 'USDC' });
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
          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'
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
                : 'bg-gray-400 dark:bg-white/40'
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500 dark:text-white/40 mb-0.5">Order ID</div>
            <button
              type="button"
              onClick={handleIdClick}
              className={`font-mono text-sm text-left block w-full break-all ${
                isSuccess && auth
                  ? 'text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 cursor-pointer underline'
                  : 'text-gray-900 dark:text-white cursor-default'
              }`}
            >
              {order.orderId}
            </button>
            <div className="text-sm text-gray-600 dark:text-white/50 truncate">{sourceLabel}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <span className={`text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
          <span className="text-xs text-gray-500 dark:text-white/40">{getOrderAgeText(order.modified)}</span>
          {isPending && elapsedMs > 0 && (
            <span className="text-xs text-amber-400/80">Duration: {formatDuration(elapsedMs)}</span>
          )}
          {isSuccess && completedDurationMs > 0 && (
            <span className="text-xs text-emerald-400/80">Completed in {formatDuration(completedDurationMs)}</span>
          )}
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
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const pendingOrders = orders.filter((o) => PENDING_STATUSES.has(o.status));

  // Poll when there are pending orders so completed ones move to History without manual refresh
  useEffect(() => {
    if (pendingOrders.length === 0) return;
    const id = setInterval(refreshOrders, 6000); // every 6 seconds
    return () => clearInterval(id);
  }, [pendingOrders.length, refreshOrders]);
  const historyOrders = orders.filter((o) => !PENDING_STATUSES.has(o.status));

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Orders</h1>
          <p className="text-gray-600 dark:text-white/60 mb-8">
            Connect your wallet to view pending swaps and order history
          </p>
          <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-12 text-center shadow-lg dark:shadow-none">
            <p className="text-gray-600 dark:text-white/50">Connect EVM or Solana wallet from the header</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Orders</h1>
          <p className="text-gray-600 dark:text-white/60 mb-8">
            Connect your wallet to view pending swaps and order history
          </p>
          <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-12 text-center shadow-lg dark:shadow-none">
            <p className="text-gray-600 dark:text-white/50">Connect EVM or Solana wallet from the header</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 py-12 max-w-2xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Orders</h1>
          <p className="text-gray-600 dark:text-white/60">
            Pending swaps and order history
          </p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={() => refreshOrders()}
            className="shrink-0 py-2.5 px-4 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-white/15 active:scale-95 active:opacity-80 transition-all duration-150"
          >
            Refresh
          </button>
        )}
      </div>

      {loading && orders.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-12 text-center shadow-lg dark:shadow-none">
          <div className="animate-pulse text-gray-600 dark:text-white/60">Loading orders...</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#161616] border border-gray-200 dark:border-white/10 p-12 text-center shadow-lg dark:shadow-none">
          <p className="text-gray-600 dark:text-white/50 mb-4">No orders yet</p>
          <p className="text-sm text-gray-500 dark:text-white/40 mb-6">
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">History</h2>
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
    </div>
  );
}
