import { ProductCategory } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface ProductCategoryRepository {
  fetchAll(): Promise<ProductCategory[]>;
  insert(category: ProductCategory): Promise<ProductCategory>;
  update(category: ProductCategory): Promise<ProductCategory>;
  delete(id: string): Promise<void>;
}

type ProductCategoryRow = Record<string, any>;

function formatForDb(c: ProductCategory) {
  return {
    id: c.id,
    name: c.name,
    description: c.description || null,
    status: c.status,
    created_at: c.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function formatFromDb(row: ProductCategoryRow): ProductCategory {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    status: row.status || 'ACTIVE',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProductCategoryRepository(adapter: DatabaseAdapter): ProductCategoryRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<ProductCategoryRow>('product_categories');
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch product categories:', err);
        return [];
      }
    },
    async insert(category) {
      try {
        const rows = await adapter.insert<ProductCategoryRow>('product_categories', [formatForDb(category)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save product category', 'product_categories', 'insert');
      }
    },
    async update(category) {
      try {
        const row = await adapter.update<ProductCategoryRow>('product_categories', category.id, formatForDb(category));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update product category', 'product_categories', 'update');
      }
    },
    async delete(id) {
      try {
        await adapter.delete('product_categories', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete product category', 'product_categories', 'delete');
      }
    },
  };
}
