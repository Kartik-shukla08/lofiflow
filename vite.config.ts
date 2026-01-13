import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Door #1: Nadeko (Very stable)
          '/api1': {
            target: 'https://inv.nadeko.net',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api1/, '/api/v1'),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          },
          // Door #2: Vern (100% uptime recently)
          '/api2': {
            target: 'https://inv.vern.cc',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api2/, '/api/v1'),
             headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          },
          // Door #3: NerdVPN (Fast backup)
          '/api3': {
            target: 'https://invidious.nerdvpn.de',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/api3/, '/api/v1'),
             headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          }
        }
      },
      plugins: [react()],
      define: {},
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});