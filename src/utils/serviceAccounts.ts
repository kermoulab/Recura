import { ServiceAccount, Order, ServiceAccountStatus, ServiceType } from '../types/erp';
import { calculateDaysRemaining } from './crypto';

export function getLinkedOrders(accountId: string, orders: Order[]): Order[] {
  return orders.filter((o) => o.serviceAccountId === accountId);
}

export function getOccupancy(account: ServiceAccount, orders: Order[]) {
  const used = getLinkedOrders(account.id, orders).length;
  const capacity = Math.max(0, account.capacity || 0);
  const available = Math.max(0, capacity - used);
  const percent = capacity > 0 ? Math.min(100, Math.round((used / capacity) * 100)) : 0;
  return { used, available, percent, capacity };
}

export function getDaysRemaining(account: ServiceAccount): number {
  return calculateDaysRemaining(account.subscriptionEnd);
}

export function getEffectiveAccountStatus(account: ServiceAccount): ServiceAccountStatus {
  if (account.status === 'Suspended') return 'Suspended';
  if (getDaysRemaining(account) < 0) return 'Expired';
  return 'Active';
}

export function getAccountById(accounts: ServiceAccount[], id?: string): ServiceAccount | undefined {
  return accounts.find((a) => a.id === id);
}

export function getNextFreeProfileNumber(accountId: string, orders: Order[]): number {
  const used = new Set(
    orders
      .filter((o) => o.serviceAccountId === accountId)
      .map((o) => o.profileNumber)
      .filter((n): n is number => typeof n === 'number')
  );
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

export function shortId(id?: string): string {
  return id && id.length > 8 ? id.slice(0, 8) : id || '';
}

export function getServiceAccountStats(accounts: ServiceAccount[], orders: Order[]) {
  const expiringSoon = accounts.filter((a) => {
    if (getEffectiveAccountStatus(a) !== 'Active') return false;
    const days = getDaysRemaining(a);
    return days >= 0 && days <= 14;
  });

  const expired = accounts.filter((a) => getEffectiveAccountStatus(a) === 'Expired');
  const suspended = accounts.filter((a) => a.status === 'Suspended');

  const withFreeProfiles = accounts.filter((a) => getOccupancy(a, orders).available > 0);
  const fullyOccupied = accounts.filter(
    (a) => a.capacity > 0 && getOccupancy(a, orders).available === 0
  );

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentlyRenewed = accounts.filter((a) => {
    const ref = a.updatedAt || a.subscriptionStart;
    const t = ref ? new Date(ref).getTime() : 0;
    return !isNaN(t) && t >= sevenDaysAgo && getEffectiveAccountStatus(a) === 'Active';
  });

  const avgOccupancy =
    accounts.length > 0
      ? Math.round(
          accounts.reduce((sum, a) => sum + getOccupancy(a, orders).percent, 0) / accounts.length
        )
      : 0;

  const totalProfiles = accounts.reduce((sum, a) => sum + (a.capacity || 0), 0);
  const totalUsedProfiles = accounts.reduce((sum, a) => sum + getOccupancy(a, orders).used, 0);

  return {
    total: accounts.length,
    expiringSoon,
    expired,
    suspended,
    withFreeProfiles,
    fullyOccupied,
    recentlyRenewed,
    avgOccupancy,
    totalProfiles,
    totalUsedProfiles,
    totalAvailableProfiles: Math.max(0, totalProfiles - totalUsedProfiles),
  };
}

export function getMostProfitableService(accounts: ServiceAccount[], orders: Order[]) {
  const byService = new Map<ServiceType, { revenue: number; count: number }>();
  for (const o of orders) {
    if (!o.serviceAccountId) continue;
    const acc = accounts.find((a) => a.id === o.serviceAccountId);
    if (!acc) continue;
    const cur = byService.get(acc.serviceType) || { revenue: 0, count: 0 };
    cur.revenue += o.price || 0;
    cur.count += 1;
    byService.set(acc.serviceType, cur);
  }
  let best: { serviceType: ServiceType; revenue: number; count: number } | null = null;
  for (const [serviceType, data] of byService) {
    if (!best || data.revenue > best.revenue) {
      best = { serviceType, ...data };
    }
  }
  return best;
}
