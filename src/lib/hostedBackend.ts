/**
 * Runtime "hosted backend" configuration.
 *
 * Any PostgreSQL exposed through a PostgREST-compatible REST API works here.
 * Supabase is one such provider (project URL + anon public key), but a
 * self-hosted PostgREST server in front of any Postgres works exactly the
 * same. The installer writes this config when the user picks the hosted
 * database option; the app reads it at startup so it can talk to the hosted
 * API directly from the browser — no Recura server involved.
 *
 * SECURITY: The key stored here is a public/anon credential — the same value
 * that would be baked into a static build anyway. Never store a service-role
 * or admin key here.
 */

export interface HostedBackendConfig {
  /** Informational provider label (e.g. 'supabase', 'postgrest'). */
  provider: string;
  /** Base URL of the database REST API (PostgREST-compatible). */
  url: string;
  /** Optional API key / anon public key. */
  key: string;
}

const CONFIG_KEY = 'recura_hosted_backend_v1';

function isValidApiUrl(url: string): boolean {
  return (
    /^https:\/\/.+/i.test(url) ||
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
  );
}

export function loadHostedConfig(): HostedBackendConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as Partial<HostedBackendConfig> & { anonKey?: string };
    if (!cfg || typeof cfg.url !== 'string') return null;
    const url = cfg.url.trim();
    if (!isValidApiUrl(url)) return null;
    // "anonKey" was the field name in older versions — keep reading it so
    // configs saved before the generalization still work.
    const key = (typeof cfg.key === 'string' ? cfg.key : cfg.anonKey || '').trim();
    return { provider: cfg.provider || 'postgrest', url, key };
  } catch {
    return null;
  }
}

export function saveHostedConfig(cfg: HostedBackendConfig): void {
  try {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ provider: cfg.provider, url: cfg.url.trim(), key: cfg.key.trim() })
    );
  } catch {
    /* storage unavailable — the config just won't persist */
  }
}

export function clearHostedConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* ignore */
  }
}

export function isHostedConfigured(): boolean {
  return loadHostedConfig() !== null;
}
