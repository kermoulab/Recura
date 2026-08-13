/**
 * Installer API client.
 *
 * Browsers cannot talk to PostgreSQL directly, so the installer talks to the
 * Recura server (/api/install/*). Credentials are sent to the server once and
 * never stored in the browser. All state-changing requests carry a CSRF token
 * (double-submit cookie) issued by GET /api/csrf.
 */

export interface DbConnectionInput {
  host: string;
  port: string;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}

export interface InstallStatus {
  status: string;
}

export interface TestConnectionResult {
  ok: boolean;
  connected?: boolean;
  serverVersion?: string;
  majorVersion?: number;
  versionSupported?: boolean;
  canCreateTables?: boolean;
  state?: 'empty' | 'complete' | 'partial' | 'unrelated';
  existingTables?: string[];
  unrelatedTables?: string[];
  migrated?: boolean | null;
  code?: string;
  message?: string;
}

export interface MigrationSummary {
  applied: { version: string; name: string }[];
  alreadyApplied: { version: string; name: string }[];
}

export interface VerifyResult {
  ok: boolean;
  checks?: { table: string; ok: boolean; rows: number }[];
  allTablesOk?: boolean;
  migrationsOk?: boolean;
  adminOk?: boolean;
  adminEmail?: string | null;
  message?: string;
}

let csrfToken: string | null = null;

/**
 * Base URL of the Recura server API (mirrors src/lib/apiClient.ts).
 *
 * Leave unset when the installer is served by the Recura server itself
 * (same-origin /api calls). Set VITE_API_URL when the installer is hosted on a
 * static host (e.g. Vercel) and talks to a hosted Recura server over CORS.
 */
function apiBase(): string {
  const envBase = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, '');
  }
  return '';
}

/** Resolves a server path against the configured API base (if any). */
function apiUrl(path: string): string {
  return apiBase() + path;
}

/** Content-type sniff: is this an API JSON response or an HTML page (SPA
 *  fallback from a static server / vite preview / dev server)? */
function isHtmlResponse(text: string, contentType: string | null): boolean {
  const trimmed = text.trimStart();
  return (
    (contentType ?? '').includes('text/html') ||
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html')
  );
}

const STATIC_SERVER_HINT =
  'The /api/install/* endpoints returned an HTML page instead of JSON — the installer is not talking to a Recura server. ' +
  (apiBase()
    ? `Check that the Recura server is running at ${apiBase()} and that VITE_API_URL points at its HTTPS origin (no trailing slash).`
    : 'Set the VITE_API_URL build environment variable to the HTTPS origin of your hosted Recura server (e.g. https://your-server.onrender.com).');

async function parseJsonOrThrow(res: Response, context: string): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  if (isHtmlResponse(text, res.headers.get('content-type'))) {
    throw new Error(`${STATIC_SERVER_HINT} (${context} returned HTML with status ${res.status}.)`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Unexpected server response (${res.status}). Reload the page and try again.`);
  }
}

async function ensureCsrf(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch(apiUrl('/api/csrf'), { method: 'GET', credentials: 'include' });
  if (!res.ok) throw new Error(`Could not reach the Recura server at ${apiUrl('/api/csrf')}. Is it running?`);
  const body = await parseJsonOrThrow(res, '/api/csrf');
  csrfToken = (body as { csrfToken?: string })?.csrfToken || null;
  if (!csrfToken) {
    throw new Error('The Recura server did not issue a security token. Reload the page and try again.');
  }
  return csrfToken;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const csrf = await ensureCsrf();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error(`Could not reach the Recura server at ${apiUrl(path)}. Is it running?`);
  }
  const data = (await parseJsonOrThrow(res, path)) as T;
  const maybeErr = data as { ok?: boolean; code?: string; message?: string };
  if (!res.ok || maybeErr.ok === false) {
    if (maybeErr.code === 'CSRF') {
      csrfToken = null; // force a fresh token next attempt
    }
    throw new Error(maybeErr.message || `Request failed (${res.status}).`);
  }
  return data;
}

export const api = {
  getStatus: async (): Promise<InstallStatus> => {
    const res = await fetch(apiUrl('/api/install/status'), { credentials: 'include' });
    if (!res.ok) throw new Error(`Could not reach the Recura server at ${apiUrl('/api/install/status')}. Is it running?`);
    return (await parseJsonOrThrow(res, '/api/install/status')) as InstallStatus;
  },

  testConnection: (db: DbConnectionInput): Promise<TestConnectionResult> =>
    post<TestConnectionResult>('/api/install/test-connection', { database: db }),

  startInstall: (db: DbConnectionInput, dbState: string, consent: boolean, resume: boolean, force = false) =>
    post<{ ok: boolean; installToken?: string; code?: string; message?: string }>(
      '/api/install/start',
      { database: db, dbState, consent, resume, force }
    ),

  migrate: (installToken: string): Promise<{ ok: boolean; result?: MigrationSummary; message?: string }> =>
    post('/api/install/migrate', {}, installToken),

  createAdmin: (
    installToken: string,
    admin: { name: string; username: string; email: string; password: string }
  ): Promise<{ ok: boolean; message?: string; code?: string }> =>
    post('/api/install/admin', admin, installToken),

  verify: (installToken: string): Promise<VerifyResult> =>
    post('/api/install/verify', {}, installToken),

  complete: (installToken: string): Promise<{ ok: boolean; redirect?: string; message?: string }> =>
    post('/api/install/complete', {}, installToken),
};
