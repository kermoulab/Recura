/**
 * App-facing API client for the Recura server (used when the app is served by
 * it in "server mode").
 *
 * The server and the SPA share an origin, so requests use relative paths:
 *   * GET  /api/install/status   install state (INSTALLED / ...)
 *   * POST /api/auth/session     issues an app bearer token after login
 *   * POST /api/auth/logout      revokes the bearer token
 *   * POST /api/db               DatabaseAdapter contract over HTTP
 *
 * CSRF uses a double-submit cookie: the server sets an HttpOnly cookie on
 * GET /api/csrf and every state-changing request must echo it in
 * X-CSRF-Token. The bearer token is kept in sessionStorage so it survives a
 * refresh of the tab but not cross-tab/session.
 *
 * All failures are normalized to DatabaseError so the UI can react to `code`.
 */
import { DatabaseError, DbErrorCode } from '../db/types';

const TOKEN_KEY = 'recura_api_token';
const CSRF_COOKIE = 'recura_csrf';

let csrfToken: string | null = null;

/**
 * Base URL of the Recura server API.
 *
 * Leave unset when the SPA is served by the Recura server itself (same-origin
 * /api calls). Set VITE_API_URL when the SPA is hosted separately (e.g. Vercel
 * static hosting) and talks to a hosted Recura server over CORS.
 */
export function apiBase(): string {
  const envBase = (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.trim().replace(/\/+$/, '');
  }
  return '';
}

/** Resolves a server path against the configured API base (if any). */
export function apiUrl(path: string): string {
  return apiBase() + path;
}

export function getApiToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable — requests will simply be unauthenticated */
  }
}

export async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  // The CSRF cookie is HttpOnly and sent by the server on GET /api/csrf. The
  // browser stores it automatically; we only cache the value to echo it back.
  const target = apiUrl('/api/csrf');
  let res: Response;
  try {
    res = await fetch(target, { method: 'GET', credentials: 'include' });
  } catch {
    throw new DatabaseError({
      code: 'NETWORK',
      message: `Could not reach the Recura server at ${target}. Is it running?`,
    });
  }
  if (!res.ok) {
    throw new DatabaseError({
      code: 'NOT_CONFIGURED',
      message: `The Recura server at ${target} is not reachable (HTTP ${res.status}).`,
    });
  }
  let body: { csrfToken?: string };
  try {
    body = (await res.json()) as { csrfToken?: string };
  } catch {
    throw new DatabaseError({
      code: 'NOT_CONFIGURED',
      message: `No Recura server detected at ${target}. ` +
        (apiBase()
          ? 'Check that the server is running and VITE_API_URL points at its HTTPS origin.'
          : 'VITE_API_URL is not set, so the app called the host it is served from. Set VITE_API_URL (e.g. https://your-server.onrender.com) or open the app through the Recura server itself.'),
    });
  }
  csrfToken = body?.csrfToken || null;
  if (!csrfToken) {
    throw new DatabaseError({
      code: 'NOT_CONFIGURED',
      message: 'The Recura server did not issue a security token. Reload the page and try again.',
    });
  }
  return csrfToken;
}

/** Maps a server error code onto the normalized DbErrorCode contract. */
function toDbCode(code: string | undefined): DbErrorCode {
  switch (code) {
    case 'NOT_CONFIGURED':
    case 'NOT_FOUND':
    case 'CONFLICT':
    case 'PERMISSION_DENIED':
    case 'AUTH_FAILED':
    case 'VALIDATION':
    case 'NETWORK':
    case 'TIMEOUT':
      return code;
    default:
      return 'UNKNOWN';
  }
}

export interface ApiPostOptions {
  /** Explicit bearer token; defaults to the stored one (if any). */
  token?: string | null;
  /** Whether to attach the stored bearer token (default true). */
  auth?: boolean;
}

/**
 * Sends a state-changing request to the Recura server and returns the JSON
 * body. Throws a DatabaseError when the server is unreachable or reports a
 * failure.
 */
export async function apiPost<T>(path: string, body: unknown, opts: ApiPostOptions = {}): Promise<T> {
  const csrf = await ensureCsrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrf,
  };
  const useAuth = opts.auth !== false;
  const token = opts.token === undefined ? getApiToken() : opts.token;
  if (useAuth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { method: 'POST', headers, credentials: 'include', body: JSON.stringify(body ?? {}) });
  } catch {
    throw new DatabaseError({
      code: 'NETWORK',
      message: 'Could not reach the Recura server. Is it running?',
    });
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new DatabaseError({
      code: 'UNKNOWN',
      message: `Unexpected server response (${res.status}). Reload the page and try again.`,
    });
  }

  const maybeErr = data as { ok?: boolean; code?: string; message?: string };
  if (!res.ok || maybeErr.ok === false) {
    if (maybeErr.code === 'CSRF') {
      csrfToken = null; // force a fresh token next attempt
      setApiToken(null); // server-sessions may have been rotated too
    }
    throw new DatabaseError({
      code: toDbCode(maybeErr.code),
      message: maybeErr.message || `Request failed (${res.status}).`,
    });
  }
  return data as T;
}
