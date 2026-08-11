import { Plan } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface PlanRepository {
  fetchAll(): Promise<Plan[]>;
  insert(plan: Plan): Promise<Plan>;
  update(plan: Plan): Promise<Plan>;
  delete(id: string): Promise<void>;
}

/** Raw row shape for the "Plan" table. */
type PlanRow = Record<string, any>;

function formatForDb(p: Plan) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    durationMonths: p.durationMonths,
    notes: p.notes || null,
    availableStock: p.availableStock,
    totalAccounts: p.totalAccounts,
    activeOrders: p.activeOrders,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatFromDb(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    category: row.category || 'Other',
    price: Number(row.price || 0),
    durationMonths: row.durationMonths ?? row.duration_months ?? 1,
    notes: row.notes || undefined,
    availableStock: row.availableStock ?? row.available_stock ?? 0,
    totalAccounts: row.totalAccounts ?? row.total_accounts ?? 0,
    activeOrders: row.activeOrders ?? row.active_orders ?? 0,
  };
}

export function createPlanRepository(adapter: DatabaseAdapter): PlanRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<PlanRow>('Plan');
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch plans:', err);
        return [];
      }
    },

    async insert(plan) {
      try {
        const rows = await adapter.insert<PlanRow>('Plan', [formatForDb(plan)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save plan to database', 'Plan', 'insert');
      }
    },

    async update(plan) {
      try {
        const row = await adapter.update<PlanRow>('Plan', plan.id, formatForDb(plan));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update plan in database', 'Plan', 'update');
      }
    },

    async delete(id) {
      try {
        await adapter.delete('Plan', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete plan from database', 'Plan', 'delete');
      }
    },
  };
}
