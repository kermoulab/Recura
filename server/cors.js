/**
 * Cross-origin API support for the Recura server.
 *
 * Same-origin is the default (most secure): the SPA is served by the server
 * and calls relative /api paths. When RECURA_CORS_ORIGINS lists one or more SPA
 * origins, the API answers cross-origin requests from those origins with
 * credentials, which lets a static-hosted SPA (e.g. Vercel) talk to a hosted
 * Recura server (e.g. Render/Railway).
 *
 * CSRF double-submit still applies: the client must echo the recura_csrf
 * cookie in X-CSRF-Token, so a malicious site cannot forge requests even
 * though the cookie is sent cross-site (SameSite=None; Secure).
 */

/** Parses the RECURA_CORS_ORIGINS env value into a list of normalized origins. */
export function parseOrigins(envValue) {
  return (envValue || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/**
 * Returns CORS headers for the request origin, or null when the request is
 * same-origin, no origins are configured, or the origin is not allowed.
 */
export function corsHeadersFor(origins, origin) {
  if (!origin || origins.length === 0 || !origins.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

/** Headers for an OPTIONS preflight response. */
export function preflightHeaders(cors) {
  return {
    ...cors,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Max-Age': '86400',
  };
}
