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

export interface PostgrestProbe {
  /** True when the URL answers like a PostgREST server (OpenAPI at the root). */
  isPostgrest: boolean;
  status: number;
  contentType: string;
  message?: string;
}

/**
 * Determines whether a URL is a PostgREST-compatible API. PostgREST serves an
 * OpenAPI document at the API root, so fetching `/` and finding an
 * `openapi`/`swagger` field identifies it. GraphQL-only gateways (e.g. Nhost
 * / Hasura) or plain web servers answer differently, which lets the installer
 * tell "schema missing" apart from "this is not a PostgREST API at all".
 */
export async function probePostgrest(url: string, key: string): Promise<PostgrestProbe> {
  const base = resolveRestBase(url);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...authHeaders(key.trim()),
  };
  try {
    const res = await fetch(base + '/', { headers });
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let payload: unknown = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    const isOpenApi =
      payload !== null &&
      typeof payload === 'object' &&
      ('openapi' in payload || 'swagger' in payload);
    return { isPostgrest: isOpenApi, status: res.status, contentType };
  } catch (err) {
    return {
      isPostgrest: false,
      status: 0,
      contentType: '',
      message: err instanceof Error ? err.message : 'Network error while probing the database API.',
    };
  }
}

export interface GraphqlProbe {
  /** True when the URL answers like a GraphQL (Hasura/Nhost) server. */
  isGraphql: boolean;
  status: number;
  contentType: string;
  /** The exact endpoint that answered like GraphQL (may differ from the input). */
  endpoint?: string;
  message?: string;
}

/**
 * Determines whether a URL is a GraphQL (Hasura / Nhost) API by POSTing a
 * trivial query. A GraphQL server answers with a JSON body that has a `data`
 * key (success) or an `errors` array (validation / auth error) — either one is
 * enough to identify the protocol. PostgREST and plain web servers answer
 * differently, so this cleanly separates "GraphQL provider" from "not a
 * database API at all". It is ONE capability detector, not a universal
 * validator — the installer combines it with the PostgREST probe.
 */
export async function probeGraphql(url: string, key: string): Promise<GraphqlProbe> {
  const base = url.trim().replace(/\/+$/, '');
  const candidates: string[] = [];
  if (/graphql/i.test(base)) candidates.push(base);
  else candidates.push(base, `${base}/v1/graphql`);

  let lastStatus = 0;
  let lastContentType = '';
  let lastMessage: string | undefined;
  for (const endpoint of candidates) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    const k = key.trim();
    if (k) {
      headers['x-hasura-admin-secret'] = k;
      headers.Authorization = `Bearer ${k}`;
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: '{ __typename }' }),
      });
      lastStatus = res.status;
      lastContentType = res.headers.get('content-type') || '';
      if (!lastContentType.includes('application/json')) continue;
      const text = await res.text();
      let payload: unknown = null;
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
      if (payload && typeof payload === 'object') {
        if ('data' in payload) return { isGraphql: true, status: res.status, contentType: lastContentType, endpoint };
        const errors = (payload as { errors?: unknown }).errors;
        if (Array.isArray(errors) && errors.length > 0) return { isGraphql: true, status: res.status, contentType: lastContentType, endpoint };
      }
    } catch (err) {
      lastMessage = err instanceof Error ? err.message : 'Network error while probing for a GraphQL API.';
    }
  }
  return { isGraphql: false, status: lastStatus, contentType: lastContentType, message: lastMessage };
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
