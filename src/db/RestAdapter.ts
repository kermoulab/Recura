/**
 * PostgREST implementation of the DatabaseAdapter contract.
 *
 * This file is the ONLY place in the application that talks to the hosted REST
 * client. It translates PostgREST mechanics (errors, ordering, upsert conflict
 * handling) into the provider-agnostic contract in src/db/types.ts. Because
 * PostgREST is the standard HTTP layer over any PostgreSQL, this adapter works
 * with Supabase and any other PostgREST-served database identically.
 */
import { rest, isRestConfigured, RestClient } from '../lib/restClient';
import { DatabaseAdapter, DatabaseError, DbErrorCode, ListOptions } from './types';

const PROVIDER = 'rest';

function getClientOrNull(): RestClient | null {
  return isRestConfigured && rest ? rest : null;
}

function getClientOrThrow(): RestClient {
  if (!isRestConfigured || !rest) {
    throw new DatabaseError({
      code: 'NOT_CONFIGURED',
      message:
        'Database not connected. Configure a hosted database in the installer, or set the database API URL and key in .env, restart the app, then try again.',
    });
  }
  return rest;
}

/**
 * Normalizes any PostgREST/network error into a DatabaseError with a stable
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

export class RestAdapter implements DatabaseAdapter {
  readonly provider = PROVIDER;

  isConnected(): boolean {
    return isRestConfigured;
  }

  getStatus() {
    return { connected: isRestConfigured, provider: PROVIDER, configured: isRestConfigured };
  }

  async list<T>(table: string, options?: ListOptions): Promise<T[]> {
    const client = getClientOrNull();
    if (!client) {
      console.warn(`Database not configured - returning empty "${table}" list.`);
      return [];
    }

    return run(async () => {
      const { data, error } = await client.get<T>(table, {
        orderBy: options?.orderBy,
        limit: options?.limit,
      });
      if (error) throw error;
      return (data ?? []) as T[];
    }, table, 'list');
  }

  async insert<T>(table: string, rows: Record<string, unknown>[]): Promise<T[]> {
    const client = getClientOrThrow();

    return run(async () => {
      const { data, error } = await client.insert<T>(table, rows);
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
      const { data, error } = await client.update<T>(table, { id }, patch);
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
      const { error } = await client.update(table, match, patch);
      if (error) throw error;
    }, table, 'updateWhere');
  }

  async delete(table: string, id: string): Promise<void> {
    const client = getClientOrThrow();

    return run(async () => {
      const { data, error } = await client.delete(table, { id });
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
      const { error } = await client.upsert(table, rows, conflictKey);
      if (error) throw error;
    }, table, 'upsert');
  }
}
