/**
 * Runtime "hosted backend" configuration (Supabase-style: a project URL + a
 * public anon key).
 *
 * This is what the installer writes when the user picks the hosted database
 * option. The app reads it at startup so it can talk to the hosted backend
 * directly from the browser — no Recura server involved.
 *
 * SECURITY: The anon (public) key is safe to store in the browser by design
 * (it is the same value that would be baked into a static build). Never store
 * a service-role / admin key here.
 */

export interface HostedBackendConfig {
  /** Provider identifier, kept for forward compatibility (e.g. 'supabase', 'postgrest'). */
  provider: string;
  /** Project / API URL, e.g. https://xyzcompany.supabase.co */
  url: string;
  /** Public anon key. */
  anonKey: string;
}

const CONFIG_KEY = 'recura_hosted_backend_v1';

export function loadHostedConfig(): HostedBackendConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as Partial<HostedBackendConfig>;
    if (!cfg || typeof cfg.url !== 'string' || typeof cfg.anonKey !== 'string') return null;
    const url = cfg.url.trim();
    const anonKey = cfg.anonKey.trim();
    if (!url || !anonKey) return null;
    return { provider: cfg.provider || 'supabase', url, anonKey };
  } catch {
    return null;
  }
}

export function saveHostedConfig(cfg: HostedBackendConfig): void {
  try {
    localStorage.setItem(
      CONFIG_KEY,
      JSON.stringify({ provider: cfg.provider, url: cfg.url.trim(), anonKey: cfg.anonKey.trim() })
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
