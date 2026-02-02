'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useBalancesContext } from '@silentswap/react';

const DROPDOWN_INTERVAL_MS = 5000;   // Swap/send balances & token dropdown
const PORTFOLIO_INTERVAL_MS = 30000; // Portfolio tab

/** Refreshes balances: 5s on swap/send (dropdown), 30s on portfolio */
export function BalanceAutoRefresher() {
  const { refetch } = useBalancesContext();
  const pathname = usePathname();
  const isPortfolio = pathname === '/portfolio';
  const intervalMs = isPortfolio ? PORTFOLIO_INTERVAL_MS : DROPDOWN_INTERVAL_MS;

  useEffect(() => {
    const id = setInterval(() => {
      refetch();
    }, intervalMs);
    return () => clearInterval(id);
  }, [refetch, intervalMs]);

  return null;
}
