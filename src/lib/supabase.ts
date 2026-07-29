/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MjUxMjAwMCwiZXhwIjoyMzg4MDg4MDAwfQ.dummykeyforpreview';

export const isSupabaseConfigured = Boolean(
  env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

