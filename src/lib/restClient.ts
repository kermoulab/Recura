/// <reference types="vite/client" />
/**
 * Minimal PostgREST client used for hosted-backend mode.
 *
 * PostgREST is the standard HTTP API over any PostgreSQL database — Supabase
 * is the most common hosted provider, but a self-hosted PostgREST server works
 * identically. Keeping this dependency-free (plain fetch) is what makes the
 * hosted option work against "any database", not just Supabase.
 */
import { loadHostedConfig } from './hostedBackend';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

// Prefer the runtime config written by the installer, then fall back to the
// build-time environment variables. The legacy VITE_SUPABASE_* names are kept
// so existing .env files keep working unchanged.
const hosted = loadHostedConfig();
const rawUrl = (hosted?.url || env.VITE_SUPABASE_URL || '').trim();
const rawKey = (hosted?.key || env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isRestConfigured = Boolean(rawUrl && !rawUrl.includes('your-project'));

export interface RestError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export interface RestResult<T> {
  data: T | null;
  error: RestError | null;
  status: number;
}

export interface RestClient {
  get<T>(table: string, opts?: {
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    eq?: Record<string, unknown>;
  }): Promise<RestResult<T[]>>;

  /** Row count matching the filters (uses PostgREST's count=exact + Prefer). */
  count(table: string, eq?: Record<string, unknown>): Promise<RestResult<number>>;

  insert<T>(table: string, rows: Record<string, unknown>[]): Promise<RestResult<T[]>>;

  update<T>(table: string, match: Record<string, unknown>, patch: Record<string, unknown>): Promise<RestResult<T[]>>;

  delete<T>(table: string, match: Record<string, unknown>): Promise<RestResult<T[]>>;

  upsert(table: string, rows: Record<string, unknown>[], conflictKey: string): Promise<RestResult<null>>;
}

/**
 * Turns a user-supplied API URL into a PostgREST root. Accepts:
 *   * a full REST base       https://db.example.com/rest/v1
 *   * a Supabase project URL https://xyz.supabase.co        → appends /rest/v1
 *   * a bare PostgREST root  https://db.example.com
 */
export function resolveRestBase(url: string): string {
  const u = url.trim().replace(/\/+$/, '');
  if (/\/(rest\/v1|api)(\/|$)/i.test(u)) return u;
  if (/\.supabase\.co$/i.test(u)) return `${u}/rest/v1`;
  return u;
}

function authHeaders(key: string): Record<string, string> {
  if (!key) return {};
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function eqParams(eq?: Record<string, unknown>): string {
  if (!eq) return '';
  const parts: string[] = [];
  for (const [column, value] of Object.entries(eq)) {
    parts.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

async function request(
  base: string,
  key: string,
  path: string,
  init: RequestInit & { prefer?: string }
): Promise<RestResult<unknown> & { headers: Headers }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...authHeaders(key),
  };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init.prefer) headers.Prefer = init.prefer;
  if (init.headers) Object.assign(headers, init.headers);

  let res: Response;
  try {
    res = await fetch(base + path, { ...init, headers });
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'Network error while reaching the database API.' },
      status: 0,
      headers: new Headers(),
    };
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const err = (payload ?? {}) as { code?: string; message?: string; details?: string; hint?: string };
    return {
      data: null,
      error: {
        message: err.message || `Database API request failed (${res.status}).`,
        code: err.code,
        details: err.details,
        hint: err.hint,
      },
      status: res.status,
      headers: res.headers,
    };
  }
  return { data: payload, error: null, status: res.status, headers: res.headers };
}

export function createRestClient(url: string, key: string): RestClient {
  const base = resolveRestBase(url);
  const keyTrimmed = key.trim();

  return {
    async get<T>(table: string, opts: {
      select?: string;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      eq?: Record<string, unknown>;
    } = {}) {
      const params = new URLSearchParams();
      params.set('select', opts.select ?? '*');
      if (opts.orderBy) {
        params.set('order', `${opts.orderBy.column}${opts.orderBy.ascending === false ? '.desc' : ''}`);
      }
      if (opts.limit) params.set('limit', String(opts.limit));
      for (const [column, value] of Object.entries(opts.eq ?? {})) {
        params.append(column, `eq.${String(value)}`);
      }
      const { data, error, status, headers } = await request(base, keyTrimmed, `/${table}?${params}`, {});
      return { data: (data ?? []) as T[], error, status };
    },

    async count(table, eq) {
      const params = new URLSearchParams();
      params.set('select', 'id');
      params.set('limit', '1');
      for (const [column, value] of Object.entries(eq ?? {})) {
        params.append(column, `eq.${String(value)}`);
      }
      const { error, status, headers } = await request(base, keyTrimmed, `/${table}?${params}`, {
        prefer: 'count=exact',
      });
      if (error) return { data: 0, error, status };
      const range = headers.get('content-range') || '';
      const match = range.match(/\/(\d+)\s*$/);
      return { data: match ? Number(match[1]) : 0, error: null, status };
    },

    async insert<T>(table, rows) {
      const { data, error, status } = await request(base, keyTrimmed, `/${table}?select=*`, {
        method: 'POST',
        prefer: 'return=representation',
        body: JSON.stringify(rows),
      });
      return { data: (data ?? []) as T[], error, status };
    },

    async update<T>(table, match, patch) {
      const { data, error, status } = await request(base, keyTrimmed, `/${table}${eqParams(match)}&select=*`, {
        method: 'PATCH',
        prefer: 'return=representation',
        body: JSON.stringify(patch),
      });
      return { data: (data ?? []) as T[], error, status };
    },

    async delete<T>(table, match) {
      const { data, error, status } = await request(base, keyTrimmed, `/${table}${eqParams(match)}&select=*`, {
        method: 'DELETE',
        prefer: 'return=representation',
      });
      return { data: (data ?? []) as T[], error, status };
    },

    async upsert(table, rows, conflictKey) {
      const { error, status } = await request(base, keyTrimmed, `/${table}?on_conflict=${encodeURIComponent(conflictKey)}`, {
        method: 'POST',
        prefer: 'resolution=merge-duplicates, return=minimal',
        body: JSON.stringify(rows),
      });
      return { data: null, error, status };
    },
  };
}

/** Singleton client built from the configured hosted backend / env vars. */
export const rest: RestClient | null = isRestConfigured ? createRestClient(rawUrl, rawKey) : null;
