import { UserProfile } from '../../types/erp';
import { DatabaseAdapter, contextualizeError } from '../types';

export interface UserProfileRepository {
  fetchAll(): Promise<UserProfile[]>;
  insert(profile: UserProfile): Promise<UserProfile>;
  update(profile: UserProfile): Promise<UserProfile>;
  delete(id: string): Promise<void>;
}

/** Raw row shape for the "User" table. */
type UserProfileRow = Record<string, any>;

function formatForDb(p: UserProfile) {
  return {
    id: p.id,
    name: p.fullName,
    username: p.username || null,
    email: p.email,
    passwordHash: p.passwordHash || null,
    role: p.role,
    mfaEnabled: false,
    currency: p.currency || null,
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function formatFromDb(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    fullName: row.name || row.fullName || 'User',
    username: row.username || undefined,
    email: row.email || '',
    passwordHash: row.passwordHash || row.password_hash || undefined,
    role: row.role || 'AGENT',
    createdAt: row.createdAt || row.created_at || new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    isBlocked: false,
    maxSessionsAllowed: 3,
    activeSessionsCount: 0,
    currency: row.currency || undefined,
  };
}

export function createUserProfileRepository(adapter: DatabaseAdapter): UserProfileRepository {
  return {
    async fetchAll() {
      try {
        const rows = await adapter.list<UserProfileRow>('User');
        return rows.map(formatFromDb);
      } catch (err) {
        console.warn('Failed to fetch user profiles:', err);
        return [];
      }
    },

    async insert(profile) {
      try {
        const rows = await adapter.insert<UserProfileRow>('User', [formatForDb(profile)]);
        return formatFromDb(rows[0]);
      } catch (err) {
        throw contextualizeError(err, 'Failed to save user profile to database', 'User', 'insert');
      }
    },

    async update(profile) {
      try {
        const row = await adapter.update<UserProfileRow>('User', profile.id, formatForDb(profile));
        return formatFromDb(row);
      } catch (err) {
        throw contextualizeError(err, 'Failed to update user profile in database', 'User', 'update');
      }
    },

    async delete(id) {
      try {
        await adapter.delete('User', id);
      } catch (err) {
        throw contextualizeError(err, 'Failed to delete user profile from database', 'User', 'delete');
      }
    },
  };
}
