'use client';

import Link from 'next/link';
import {
  useOrdersContext,
  type OrdersContextOrder,
  type OrdersContextType,
} from '@silentswap/react';
import { useUserAddress } from '@/hooks/useUserAddress';

const PENDING_STATUSES = new Set(['INIT', 'IN_PROGRESS']);
const SUCCESS_STATUS = 'COMPLETE';

function OrderRow({
  order,
  getOrderAgeText,
  getStatusInfo,
}: {
  order: OrdersContextOrder;
  getOrderAgeText: (modified?: number) => string;
  getStatusInfo: OrdersContextType['getStatusInfo'];
}) {
  const statusInfo = getStatusInfo(order.status);
  const isPending = PENDING_STATUSES.has(order.status);
  const isSuccess = order.status === SUCCESS_STATUS;

  const caip19 = order.metadata?.sourceAsset?.caip19 ?? '';
  const amount = order.metadata?.sourceAsset?.amount ?? '?';
  const chainLabel = caip19.includes('43114') ? 'USDC (AVAX)' : caip19.includes('solana') ? 'USDC (SOL)' : caip19.includes('1/') ? 'USDC (ETH)' : 'USDC';
  const sourceLabel = order.metadata?.sourceAsset ? `${amount} ${chainLabel}` : '—';

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
        isPending
          ? 'bg-amber-500/5 border-amber-500/20'
          : isSuccess
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-white/5 border-white/10'
      }`}
    >
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
          <div className="font-medium text-white truncate">
            {order.orderId.slice(0, 12)}...
          </div>
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
  );
}

export default function OrdersPage() {
  const { isConnected } = useUserAddress();
  const { orders, loading, refreshOrders, getOrderAgeText, getStatusInfo } =
    useOrdersContext();

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
