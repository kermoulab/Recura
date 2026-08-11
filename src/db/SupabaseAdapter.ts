/**
 * Supabase implementation of the DatabaseAdapter contract.
 *
 * This file is the ONLY place in the application that imports the Supabase
 * client. It translates Supabase PostgREST mechanics (errors, ordering, upsert
 * conflict handling) into the provider-agnostic contract in src/db/types.ts.
 *
 * Table names are still referenced here (the adapter is schema-agnostic and
 * receives the table name per call), but the app-facing domain mapping lives
 * in the repositories.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DatabaseAdapter, DatabaseError, DbErrorCode, ListOptions } from './types';

const PROVIDER = 'supabase';

function getClientOrNull() {
  return isSupabaseConfigured && supabase ? supabase : null;
}

function getClientOrThrow(): NonNullable<typeof supabase> {
  if (!isSupabaseConfigured || !supabase) {
    throw new DatabaseError({
      code: 'NOT_CONFIGURED',
      message:
        'Database not connected. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, restart the app, then try again.',
    });
  }
  return supabase;
}

/**
 * Normalizes any Supabase/network error into a DatabaseError with a stable
 * `code` the UI can react to.
 */
function normalizeError(err: unknown, table: string, operation: string): DatabaseError {
  if (err instanceof DatabaseError) return err;

  const raw = (err ?? {}) as { code?: string; message?: string };
  const message = raw?.message || (err instanceof Error ? err.message : String(err));

  let code: DbErrorCode = 'UNKNOWN';
  const codeStr = raw?.code || '';

  if (/^2350[2-8]$/.test(codeStr) || codeStr === '23514') {
    code = 'CONFLICT'; // unique_violation, foreign_key_violation, etc.
  } else if (/^4250[1-3]$/.test(codeStr) || codeStr === '42501') {
    code = 'PERMISSION_DENIED';
  } else if (/failed to fetch|network|econn|socket/i.test(message)) {
    code = 'NETWORK';
  } else if (/timed? ?out/i.test(message)) {
    code = 'TIMEOUT';
  }

  return new DatabaseError({ code, message, table, operation, cause: err });
}

async function run<T>(fn: () => Promise<T>, table: string, operation: string): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw normalizeError(err, table, operation);
  }
}

export class SupabaseAdapter implements DatabaseAdapter {
  readonly provider = PROVIDER;

  isConnected(): boolean {
    return isSupabaseConfigured;
  }

  getStatus() {
    return { connected: isSupabaseConfigured, provider: PROVIDER, configured: isSupabaseConfigured };
  }

  async list<T>(table: string, options?: ListOptions): Promise<T[]> {
    const client = getClientOrNull();
    if (!client) {
      console.warn(`Database not configured - returning empty "${table}" list.`);
      return [];
    }

    return run(async () => {
      let query = client.from(table).select('*');
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
      }
      if (options?.limit && options.limit > 0) {
        query = query.limit(options.limit);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as T[];
    }, table, 'list');
  }

  async insert<T>(table: string, rows: Record<string, unknown>[]): Promise<T[]> {
    const client = getClientOrThrow();

    return run(async () => {
      const { data, error } = await client.from(table).insert(rows).select();
      if (error) throw error;
      const inserted = (data ?? []) as T[];
      if (inserted.length === 0) {
        throw new DatabaseError({
          code: 'UNKNOWN',
          message: `Failed to save row to "${table}": no row returned`,
          table,
          operation: 'insert',
        });
      }
      return inserted;
    }, table, 'insert');
  }

  async update<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T> {
    const client = getClientOrThrow();

    return run(async () => {
      const { data, error } = await client.from(table).update(patch).eq('id', id).select();
      if (error) throw error;
      const updated = (data ?? []) as T[];
      if (updated.length === 0) {
        throw new DatabaseError({
          code: 'NOT_FOUND',
          message: `No "${table}" row found with id "${id}"`,
          table,
          operation: 'update',
        });
      }
      return updated[0];
    }, table, 'update');
  }

  async updateWhere(
    table: string,
    match: Record<string, unknown>,
    patch: Record<string, unknown>
  ): Promise<void> {
    const client = getClientOrThrow();

    return run(async () => {
      let query = client.from(table).update(patch);
      for (const [key, value] of Object.entries(match)) {
        query = query.eq(key, value);
      }
      const { error } = await query;
      if (error) throw error;
    }, table, 'updateWhere');
  }

  async delete(table: string, id: string): Promise<void> {
    const client = getClientOrThrow();

    return run(async () => {
      const { data, error } = await client.from(table).delete().eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new DatabaseError({
          code: 'NOT_FOUND',
          message: `No "${table}" row found with id "${id}"`,
          table,
          operation: 'delete',
        });
      }
    }, table, 'delete');
  }

  async upsert(table: string, rows: Record<string, unknown>[], conflictKey: string): Promise<void> {
    const client = getClientOrThrow();

    return run(async () => {
      const { error } = await client.from(table).upsert(rows, { onConflict: conflictKey });
      if (error) throw error;
    }, table, 'upsert');
  }
}
