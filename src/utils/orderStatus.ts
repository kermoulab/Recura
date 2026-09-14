import { Order } from '../types/erp';
import { calculateDaysRemaining } from './crypto';

/**
 * Runtime status values that exist in the DB / modal select
 * but are not part of the SubscriptionStatus union type.
 */
type ExtendedStatus = 'PENDING' | 'CANCELLED' | 'ACTIVE' | 'EXPIRING_7D' | 'EXPIRING_3D' | 'EXPIRED';

/**
 * Derives the effective display status of an order from its endDate.
 * This ensures expired / near-expiry orders always appear in the alerts
 * pipeline without requiring a background cron to update the stored status.
 * Stored CANCELLED / PENDING statuses are preserved as-is.
 */
export function deriveOrderStatus(order: Order): ExtendedStatus {
  if (order.status === ('CANCELLED' as any)) return 'CANCELLED';
  if (order.status === ('PENDING' as any)) return 'PENDING';
  if (!order.endDate) return (order.status as ExtendedStatus) || 'ACTIVE';

  const daysLeft = calculateDaysRemaining(order.endDate);
  if (daysLeft < 0) return 'EXPIRED';
  if (daysLeft <= 3) return 'EXPIRING_3D';
  if (daysLeft <= 7) return 'EXPIRING_7D';
  return 'ACTIVE';
}
