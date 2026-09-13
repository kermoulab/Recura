import { Product } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface ProductRepository {
  fetchAll(): Promise<Product[]>;
  insert(product: Product): Promise<Product>;
  update(product: Product): Promise<Product>;
  delete(id: string): Promise<void>;
}

type ProductRow = Record<string, any>;

function formatForDb(p: Product) {
  return {
    id: p.id,
    name: p.name,
    description: p.description || null,
    category_id: p.categoryId || null,
    provider_id: p.providerId || null,
    fulfillment_type: p.fulfillmentType,
    status: p.status,
    metadata: p.metadata || {},
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function formatFromDb(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    categoryId: row.category_id || undefined,
    providerId: row.provider_id || undefined,
    fulfillmentType: row.fulfillment_type || 'MANUAL',
    status: row.status || 'ACTIVE',
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProductRepository(adapter: DatabaseAdapter): ProductRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<ProductRow>('products');
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch products:', err);
        return [];
      }
    },
    async insert(product) {
      try {
        const rows = await adapter.insert<ProductRow>('products', [formatForDb(product)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save product', 'products', 'insert');
      }
    },
    async update(product) {
      try {
        const row = await adapter.update<ProductRow>('products', product.id, formatForDb(product));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update product', 'products', 'update');
      }
    },
    async delete(id) {
      try {
        await adapter.delete('products', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete product', 'products', 'delete');
      }
    },
  };
}
