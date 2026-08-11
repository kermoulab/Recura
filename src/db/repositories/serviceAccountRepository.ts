import { ServiceAccount } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';
import { toDateOnly } from '../mappers';

export interface ServiceAccountRepository {
  fetchAll(): Promise<ServiceAccount[]>;
  insert(account: ServiceAccount): Promise<ServiceAccount>;
  update(account: ServiceAccount): Promise<ServiceAccount>;
  delete(id: string): Promise<void>;
}

/** Raw row shape for the "service_accounts" table (snake_case columns). */
type ServiceAccountRow = Record<string, any>;

function formatForDb(a: ServiceAccount) {
  return {
    id: a.id,
    service_type: a.serviceType,
    provider_id: a.providerId || null,
    email: a.email,
    password: a.passwordEncrypted || null,
    subscription_start: a.subscriptionStart || null,
    subscription_end: a.subscriptionEnd || null,
    purchase_cost: a.purchaseCost || 0,
    capacity: a.capacity,
    status: a.status,
    notes: a.notes || null,
    created_at: a.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function formatFromDb(row: ServiceAccountRow): ServiceAccount {
  return {
    id: row.id,
    serviceType: row.serviceType || row.service_type || 'Other',
    providerId: row.providerId || row.provider_id || undefined,
    email: row.email || '',
    passwordEncrypted: row.password || undefined,
    subscriptionStart: toDateOnly(row.subscriptionStart || row.subscription_start),
    subscriptionEnd: toDateOnly(row.subscriptionEnd || row.subscription_end),
    purchaseCost: Number(row.purchaseCost ?? row.purchase_cost ?? 0),
    capacity: row.capacity || 1,
    status: row.status || 'Active',
    notes: row.notes || undefined,
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: row.updatedAt || row.updated_at || undefined,
  };
}

export function createServiceAccountRepository(adapter: DatabaseAdapter): ServiceAccountRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<ServiceAccountRow>('service_accounts', {
          orderBy: { column: 'created_at', ascending: false },
        });
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch service accounts:', err);
        return [];
      }
    },

    async insert(account) {
      try {
        const rows = await adapter.insert<ServiceAccountRow>('service_accounts', [formatForDb(account)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save service account to database', 'service_accounts', 'insert');
      }
    },

    async update(account) {
      try {
        const row = await adapter.update<ServiceAccountRow>('service_accounts', account.id, formatForDb(account));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update service account in database', 'service_accounts', 'update');
      }
    },

    async delete(id) {
      try {
        await adapter.delete('service_accounts', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete service account from database', 'service_accounts', 'delete');
      }
    },
  };
}
