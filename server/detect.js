/**
 * Provider / protocol detection for the installer.
 *
 * Given whatever the user pastes (a postgres:// connection string, an
 * https:// API URL, or a set of manual connection fields), this classifies:
 *
 *   * engine    — 'postgres' (Recura only supports PostgreSQL)
 *   * protocol  — 'postgres' | 'postgrest' | 'graphql' | 'unknown'
 *   * provider  — 'supabase' | 'nhost' | 'neon' | 'render' | 'railway'
 *                 | 'postgrest' | 'hasura' | 'self-hosted' | 'unknown'
 *   * mode      — how the installer should proceed:
 *                 'server'         → install over direct PostgreSQL (server-side)
 *                 'hosted'         → PostgREST hosted option (browser-side)
 *                 'needs-postgres' → protocol detected, but automatic schema
 *                                    installation requires a Postgres
 *                                    connection string instead
 *                 'unknown'        → could not be identified
 *
 * Detection is deliberately heuristic and SYNCHRONOUS — it never makes
 * outbound requests. Live capability probing (does this URL actually answer
 * like PostgREST?) happens in the browser (src/lib/restClient.ts), where the
 * user's own network is contacted; the Recura server must never fetch an
 * arbitrary URL supplied by the client (SSRF).
 *
 * SECURITY: this module never returns or echoes the password or the raw
 * connection string. For postgres:// inputs it returns only the normalized,
 * non-secret fields (host, port, database, user, ssl).
 */

import { parsePostgresUrl } from './db.js';

const POSTGRES_RE = /^postgres(ql)?:\/\//i;
const HTTPS_RE = /^https?:\/\//i;

// GraphQL is detected from the path (/v1/graphql) or from the host
// (graphql.<subdomain>.<region>.nhost.run, *.hasura.app, ...). This is what
// tells an Nhost GraphQL endpoint apart from a PostgREST one — the two must
// never be confused.
const GRAPHQL_PATH_RE = /\/v1\/graphql$/i;
const GRAPHQL_HOST_RE = /^(graphql[.-]|.*\.graphql\.)|\.hasura\.|\.hasura\.app/i;

const PROVIDER_HOST_RULES = [
  { match: /supabase/i, provider: 'supabase' },
  { match: /nhost/i, provider: 'nhost' },
  { match: /neon/i, provider: 'neon' },
  { match: /onrender\.com/i, provider: 'render' },
  { match: /railway\.app/i, provider: 'railway' },
];

function providerFromHost(host) {
  for (const rule of PROVIDER_HOST_RULES) {
    if (rule.match.test(host)) return rule.provider;
  }
  return null;
}

/** Friendly, non-technical hints keyed by (mode, provider). */
const HINTS = {
  server: 'Direct PostgreSQL connection — Recura will install its database automatically. Nothing else to do.',
  'needs-postgres': {
    graphql:
      'This looks like a GraphQL API (for example Nhost or Hasura). Recura installs its database over direct PostgreSQL — paste the Postgres connection string from your provider dashboard instead (Nhost: Dashboard → Settings → Database).',
    nhost:
      'This looks like an Nhost GraphQL API. Recura installs its database over direct PostgreSQL — paste your Nhost Postgres connection string from the Nhost Dashboard (Settings → Database).',
  },
  hosted: {
    supabase:
      'This looks like a Supabase REST (PostgREST) API. The hosted-database option can read and write data through it, but automatic schema installation needs your Postgres connection string instead (Supabase: Project Settings → Database).',
    default:
      'This looks like a PostgREST REST API. The hosted-database option can read and write data through it, but automatic schema installation needs the Postgres connection string instead.',
  },
  unknown: {
    nhost:
      'This looks like an Nhost project address. Nhost exposes a GraphQL API, but Recura installs its database over direct PostgreSQL — paste your Nhost Postgres connection string from the Nhost Dashboard (Settings → Database).',
    default:
      "We couldn't identify this address. Paste a connection string that starts with postgres:// (from your provider dashboard) or an https:// API URL.",
  },
};

function classifyString(raw) {
  const input = String(raw || '').trim();
  if (!input) {
    return { ok: false, code: 'EMPTY', message: 'Please paste a database address or connection string.' };
  }
  if (input.length > 2000) {
    return { ok: false, code: 'INVALID', message: 'That address is too long. Check it and try again.' };
  }

  // --- Direct PostgreSQL connection string (the preferred install path) ---
  if (POSTGRES_RE.test(input)) {
    let parsed;
    try {
      parsed = parsePostgresUrl(input);
    } catch (err) {
      return { ok: false, protocol: 'postgres', code: 'INVALID', message: err.message };
    }
    const provider = providerFromHost(parsed.host) || 'self-hosted';
    return {
      ok: true,
      engine: 'postgres',
      protocol: 'postgres',
      provider,
      mode: 'server',
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      user: parsed.user,
      ssl: parsed.ssl,
      hints: [HINTS.server],
    };
  }

  // --- HTTP(S) API URL ---
  if (HTTPS_RE.test(input)) {
    let u;
    try {
      u = new URL(input);
    } catch {
      return { ok: false, protocol: 'http', code: 'INVALID', message: 'That address could not be read. Check it and try again.' };
    }
    const host = u.hostname.toLowerCase();
    const path = u.pathname;
    const hostProvider = providerFromHost(host);

    if (GRAPHQL_PATH_RE.test(path) || GRAPHQL_HOST_RE.test(host)) {
      const provider = hostProvider || 'hasura';
      return {
        ok: true,
        engine: 'postgres',
        protocol: 'graphql',
        provider,
        mode: 'needs-postgres',
        hints: [HINTS['needs-postgres'][provider] || HINTS['needs-postgres'].graphql],
      };
    }

    // PostgREST is only claimed on a strong signal: a Supabase host or the
    // explicit /rest/v1 mount. A bare /api or any other path is deliberately
    // left as 'unknown' — never guess.
    if (hostProvider === 'supabase' || /\/rest\/v1(\/|$)/i.test(path)) {
      const provider = hostProvider || 'postgrest';
      return {
        ok: true,
        engine: 'postgres',
        protocol: 'postgrest',
        provider,
        mode: 'hosted',
        hints: [HINTS.hosted[provider] || HINTS.hosted.default],
      };
    }

    return {
      ok: true,
      engine: 'postgres',
      protocol: 'unknown',
      provider: hostProvider || 'unknown',
      mode: 'unknown',
      hints: [HINTS.unknown[hostProvider || 'default'] || HINTS.unknown.default],
    };
  }

  // --- Anything else ---
  return {
    ok: false,
    protocol: 'unknown',
    code: 'UNKNOWN',
    message: "That doesn't look like a database address. It should start with postgres:// or https://.",
  };
}

/**
 * Classifies installer input. Accepts either a raw string or an object with a
 * `url`/`connectionString` field, or manual host/port/database/user fields.
 * Never throws; never returns credentials.
 */
export function detect(input) {
  if (typeof input === 'string') return classifyString(input);

  if (input && typeof input === 'object') {
    const url = typeof input.url === 'string'
      ? input.url.trim()
      : typeof input.connectionString === 'string'
        ? input.connectionString.trim()
        : '';
    if (url) return classifyString(url);

    const hasManual = Boolean(input.host || input.database || input.user);
    if (hasManual) {
      return {
        ok: true,
        engine: 'postgres',
        protocol: 'postgres',
        provider: providerFromHost(String(input.host || '')) || 'self-hosted',
        mode: 'server',
        hints: [HINTS.server],
      };
    }
  }

  return { ok: false, code: 'EMPTY', message: 'Please paste a database address or connection string.' };
}
