import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import dotenv from 'dotenv';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';

dotenv.config();

import { handleApiRequest } from './src/server/apiRouter';

function weddingBotApiPlugin(): Plugin {
  return {
    name: 'wedding-bot-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api')) {
          return next();
        }
        let body: any = null;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          let raw = '';
          req.on('data', (chunk) => {
            raw += chunk;
          });
          await new Promise((resolve) => req.on('end', resolve));
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
        }
        const pathname = req.url.split('?')[0];
        const { status, data } = await handleApiRequest(req.method || 'GET', pathname, body);
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      weddingBotApiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          id: '/',
          name: 'Mỹ Vinh - Trợ Lý Mời Cưới Thông Minh',
          short_name: 'Mỹ Vinh',
          description: 'Trợ lý ảo chatbot quản lý danh sách khách mời đám cưới, tự động bóc tách thông tin và báo trùng.',
          theme_color: '#9E1B32',
          background_color: '#FAF7F2',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
