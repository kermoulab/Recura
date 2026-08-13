/**
 * Server implementation of the DatabaseAdapter contract.
 *
 * Used when the SPA is served by the Recura server and the installation
 * status is INSTALLED. All persistence goes through POST /api/db — the server
 * validates table/column names against an allow-list and binds every value as
 * a parameter, so no SQL identifiers from the client are ever interpolated.
 *
 * Session lifecycle:
 *   * Reads (list) need no token — mirrors the hosted REST anon-key trust model.
 *   * Mutations need a bearer token issued by POST /api/auth/session after a
 *     successful client-side login. App.tsx calls registerSession on login /
 *     session restore and unregisterSession on logout.
 */
import { DatabaseAdapter, DatabaseError, DbStatus, ListOptions } from './types';
import { apiPost, getApiToken, setApiToken } from '../lib/apiClient';

const PROVIDER = 'recura-server';

export class ApiAdapter implements DatabaseAdapter {
  readonly provider = PROVIDER;

  isConnected(): boolean {
    return true;
  }

  getStatus(): DbStatus {
    return { connected: true, provider: PROVIDER, configured: true };
  }

  async list<T>(table: string, options?: ListOptions): Promise<T[]> {
    const { data } = await apiPost<{ data: T[] }>('/api/db', { op: 'list', table, options });
    return data ?? [];
  }

  async insert<T>(table: string, rows: Record<string, unknown>[]): Promise<T[]> {
    const { data } = await apiPost<{ data: T[] }>('/api/db', { op: 'insert', table, rows });
    const inserted = data ?? [];
    if (inserted.length === 0) {
      throw new DatabaseError({
        code: 'UNKNOWN',
        message: `Failed to save row to "${table}": no row returned`,
        table,
        operation: 'insert',
      });
    }
    return inserted;
  }

  async update<T>(table: string, id: string, patch: Record<string, unknown>): Promise<T> {
    const { data } = await apiPost<{ data: T }>('/api/db', { op: 'update', table, id, patch });
    return data;
  }

  async updateWhere(
    table: string,
    match: Record<string, unknown>,
    patch: Record<string, unknown>
  ): Promise<void> {
    await apiPost<{ data: boolean }>('/api/db', { op: 'updateWhere', table, match, patch });
  }

  async delete(table: string, id: string): Promise<void> {
    await apiPost<{ data: boolean }>('/api/db', { op: 'delete', table, id });
  }

  async upsert(table: string, rows: Record<string, unknown>[], conflictKey: string): Promise<void> {
    await apiPost<{ data: boolean }>('/api/db', { op: 'upsert', table, rows, conflictKey });
  }

  /** Bearer tokens are issued by POST /api/auth/login and stored in
   *  sessionStorage by the login view (see LoginView + apiClient.setApiToken).
   *  Kept as a no-op to satisfy the adapter contract; the token survives
   *  tab refreshes via sessionStorage. */
  async registerSession(): Promise<void> {
    return;
  }

  /** Revokes the server-side session on logout. Best effort — failures are
   *  swallowed so logout never blocks on an unreachable server. */
  async unregisterSession(): Promise<void> {
    const token = getApiToken();
    if (!token) return;
    setApiToken(null);
    try {
      await apiPost<{ ok: boolean }>('/api/auth/logout', {}, { token, auth: true });
    } catch {
      /* best effort — the token is already cleared client-side */
    }
  }
}
