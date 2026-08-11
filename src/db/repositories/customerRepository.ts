import { Customer } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface CustomerRepository {
  fetchAll(): Promise<Customer[]>;
  insert(customer: Customer): Promise<Customer>;
  update(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
}

/** Raw row shape for the "Customer" table (camelCase columns, Postgres). */
type CustomerRow = Record<string, any>;

function formatForDb(c: Customer) {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    email: c.email || null,
    preferredLanguage: c.preferredLanguage,
    status: c.status,
    notes: c.notes || null,
    isDeleted: false,
    createdAt: c.registrationDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatFromDb(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    whatsapp: row.whatsapp,
    email: row.email || undefined,
    preferredLanguage: row.preferredLanguage || row.preferred_language || 'EN',
    registrationDate: row.createdAt || row.registrationDate || new Date().toISOString().split('T')[0],
    status: row.status || 'ACTIVE',
    ordersCount: Number(row.ordersCount ?? row.orders_count ?? 0),
    totalSpent: Number(row.totalSpent ?? row.total_spent ?? 0),
    notes: row.notes || undefined,
  };
}

export function createCustomerRepository(adapter: DatabaseAdapter): CustomerRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<CustomerRow>('Customer');
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch customers:', err);
        return [];
      }
    },

    async insert(customer) {
      try {
        const rows = await adapter.insert<CustomerRow>('Customer', [formatForDb(customer)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save customer to database', 'Customer', 'insert');
      }
    },

    async update(customer) {
      try {
        const row = await adapter.update<CustomerRow>('Customer', customer.id, formatForDb(customer));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update customer in database', 'Customer', 'update');
      }
    },

    async delete(id) {
      try {
        await adapter.delete('Customer', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete customer from database', 'Customer', 'delete');
      }
    },
  };
}
