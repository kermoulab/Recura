/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { loadHostedConfig } from './hostedBackend';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

// Prefer the runtime config written by the installer (hosted backend option),
// then fall back to the build-time environment variables.
const hosted = loadHostedConfig();
const supabaseUrl = (hosted?.url || env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (hosted?.anonKey || env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
