import { DigitalAsset } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface DigitalAssetRepository {
  fetchAll(): Promise<DigitalAsset[]>;
  insert(asset: DigitalAsset): Promise<DigitalAsset>;
  update(asset: DigitalAsset): Promise<DigitalAsset>;
  delete(id: string): Promise<void>;
}

type DigitalAssetRow = Record<string, any>;

function formatForDb(a: DigitalAsset) {
  return {
    id: a.id,
    product_id: a.productId,
    fulfillment_type: a.fulfillmentType,
    identifier: a.identifier,
    status: a.status,
    capacity: a.capacity,
    occupied_capacity: a.occupiedCapacity,
    expires_at: a.expiresAt || null,
    metadata: a.metadata || {},
    created_at: a.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function formatFromDb(row: DigitalAssetRow): DigitalAsset {
  return {
    id: row.id,
    productId: row.product_id,
    fulfillmentType: row.fulfillment_type,
    identifier: row.identifier,
    status: row.status || 'AVAILABLE',
    capacity: row.capacity || 1,
    occupiedCapacity: row.occupied_capacity || 0,
    expiresAt: row.expires_at || undefined,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createDigitalAssetRepository(adapter: DatabaseAdapter): DigitalAssetRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<DigitalAssetRow>('digital_assets');
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch digital assets:', err);
        return [];
      }
    },
    async insert(asset) {
      try {
        const rows = await adapter.insert<DigitalAssetRow>('digital_assets', [formatForDb(asset)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save digital asset', 'digital_assets', 'insert');
      }
    },
    async update(asset) {
      try {
        const row = await adapter.update<DigitalAssetRow>('digital_assets', asset.id, formatForDb(asset));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update digital asset', 'digital_assets', 'update');
      }
    },
    async delete(id) {
      try {
        await adapter.delete('digital_assets', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete digital asset', 'digital_assets', 'delete');
      }
    },
  };
}
