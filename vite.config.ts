import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          app: path.resolve(__dirname, 'index.html'),
          installer: path.resolve(__dirname, 'installer', 'index.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // In dev the SPA is served by Vite; proxy API calls to the Recura server
      // so the app works with `npm run dev` alongside `npm run dev:server`.
      proxy: {
        '/api': {
          target: process.env.RECURA_SERVER_URL || 'http://localhost:8787',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'mobile-config',
        generateBundle() {
          const config = {
            backendUrl: process.env.VITE_API_URL || '',
            supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.DATABASE_URL || '',
            supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
          };
          this.emitFile({
            type: 'asset',
            fileName: 'mobile-config.json',
            source: JSON.stringify(config, null, 2)
          });
        }
      }
    ],
  };
});
