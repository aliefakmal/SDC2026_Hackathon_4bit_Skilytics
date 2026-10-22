import fs from 'node:fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.VITE_PORT || (process.env.PORT && process.env.PORT !== '5000' ? process.env.PORT : '3000');
const port = Number(rawPort) || 3000;
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(
      process.env.VITE_API_URL || process.env.API_URL || ''
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: 'copy-404-fallback',
      closeBundle() {
        const outDir = path.resolve(import.meta.dirname, 'dist/public');
        const indexPath = path.resolve(outDir, 'index.html');
        const fallbackPath = path.resolve(outDir, '404.html');
        try {
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, fallbackPath);

            const spaRoutes = [
              'login',
              'register',
              'onboarding',
              'onboarding/cv',
              'onboarding/review',
              'onboarding/skills',
              'onboarding/goals',
              'onboarding/experience',
              'onboarding/confirm',
              'me',
              'me/outlook',
              'me/profiles',
              'roles',
              'courses',
              'market',
              'sources',
              'hr',
              'hr/members',
              'hr/courses',
              'tvet',
              'tvet/students',
              'tvet/programmes',
              'tvet/market',
            ];

            for (const r of spaRoutes) {
              const targetDir = path.resolve(outDir, r);
              fs.mkdirSync(targetDir, { recursive: true });
              fs.copyFileSync(indexPath, path.resolve(targetDir, 'index.html'));
            }

            const serviceVercel = path.resolve(import.meta.dirname, 'vercel.json');
            if (fs.existsSync(serviceVercel)) {
              fs.copyFileSync(serviceVercel, path.resolve(outDir, 'vercel.json'));
            }
          }
        } catch (e) {
          console.warn('[vite-plugin] fallback copy failed:', e);
        }
      },
    },
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      '/api': {
        target: process.env.API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
