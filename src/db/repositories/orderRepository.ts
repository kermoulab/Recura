import { Order } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';
import { toDateOnly } from '../mappers';

export interface OrderRepository {
  fetchAll(): Promise<Order[]>;
  insert(order: Order): Promise<Order>;
  update(order: Order): Promise<Order>;
  delete(id: string): Promise<void>;

  /**
   * Keeps the denormalized Order.customerName / Order.customerWhatsApp columns
   * in sync with the CURRENT Customer record after a customer edit. The shared
   * database schema requires these columns, so they are treated as a cache of
   * the live relationship instead of being removed.
   */
  syncCustomerSnapshot(customerId: string, name: string, whatsapp: string): Promise<void>;

  /**
   * Keeps the denormalized Order.planName column in sync with the CURRENT Plan
   * record after a plan edit (name changes only; price/duration remain the
   * historical sale values captured on the order).
   */
  syncPlanSnapshot(planId: string, name: string): Promise<void>;
}

/** Raw row shape for the "Order" table. */
type OrderRow = Record<string, any>;

function formatForDb(o: Order) {
  return {
    id: o.id,
    orderNumber: o.orderNumber || null,
    customerId: o.customerId,
    customerName: o.customerName,
    customerWhatsApp: o.customerWhatsApp,
    planId: o.planId,
    planName: o.planName,
    price: o.price,
    durationMonths: o.durationMonths,
    startDate: o.startDate,
    endDate: o.endDate,
    status: o.status,
    accountEmail: o.accountEmail,
    accountPasswordEncrypted: o.accountPasswordEncrypted,
    pinCodeEncrypted: o.pinCodeEncrypted || null,
    screenProfileName: o.screenProfileName || null,
    notes: o.notes || null,
    contactedForRenewal: o.contactedForRenewal || false,
    contactedAt: o.contactedAt || null,
    service_account_id: o.serviceAccountId || null,
    profile_number: o.profileNumber || null,
    isDeleted: false,
    createdAt: o.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatFromDb(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: Number(row.orderNumber || 0) || undefined,
    customerId: row.customerId || row.customer_id || '',
    customerName: row.customerName || row.customer_name || 'Customer',
    customerWhatsApp: row.customerWhatsApp || row.customer_whatsapp || '',
    planId: row.planId || row.plan_id || '',
    planName: row.planName || row.plan_name || 'Subscription',
    price: Number(row.price || 0),
    durationMonths: row.durationMonths ?? row.duration_months ?? 1,
    startDate: toDateOnly(row.startDate || row.start_date),
    endDate: toDateOnly(row.endDate || row.end_date),
    status: row.status || 'ACTIVE',
    accountEmail: row.accountEmail || row.account_email || '',
    accountPasswordEncrypted: row.accountPasswordEncrypted || row.account_password_encrypted || '',
    pinCodeEncrypted: row.pinCodeEncrypted || row.pin_code_encrypted || undefined,
    screenProfileName: row.screenProfileName || row.screen_profile_name || undefined,
    notes: row.notes || undefined,
    contactedForRenewal: Boolean(row.contactedForRenewal ?? row.contacted_for_renewal ?? false),
    contactedAt: row.contactedAt || row.contacted_at || undefined,
    serviceAccountId: row.serviceAccountId || row.service_account_id || undefined,
    profileNumber: row.profileNumber || row.profile_number || undefined,
    createdAt: row.createdAt || row.created_at || undefined,
  };
}

export function createOrderRepository(adapter: DatabaseAdapter): OrderRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<OrderRow>('Order', { orderBy: { column: 'createdAt', ascending: false } });
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch orders:', err);
        return [];
      }
    },

    async insert(order) {
      try {
        const rows = await adapter.insert<OrderRow>('Order', [formatForDb(order)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save order to database', 'Order', 'insert');
      }
    },

    async update(order) {
      try {
        const row = await adapter.update<OrderRow>('Order', order.id, formatForDb(order));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update order in database', 'Order', 'update');
      }
    },

    async delete(id) {
      try {
        await adapter.delete('Order', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete order from database', 'Order', 'delete');
      }
    },

    async syncCustomerSnapshot(customerId, name, whatsapp) {
      try {
        await adapter.updateWhere(
          'Order',
          { customerId },
          { customerName: name, customerWhatsApp: whatsapp }
        );
      } catch (err) {
        throw contextualizeError(err, 'Failed to sync customer name into linked orders', 'Order', 'updateWhere');
      }
    },

    async syncPlanSnapshot(planId, name) {
      try {
        await adapter.updateWhere('Order', { planId }, { planName: name });
      } catch (err) {
        throw contextualizeError(err, 'Failed to sync plan name into linked orders', 'Order', 'updateWhere');
      }
    },
  };
}
