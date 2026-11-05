import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { getLiveOrCachedPrices } from './server.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-dev-server',
      configureServer(server) {
        server.middlewares.use('/api/prices', async (req, res) => {
          try {
            const force = req.url && req.url.includes('refresh=1');
            const data = await getLiveOrCachedPrices(force);
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Gagal memproses data harga', detail: err.message }));
          }
        });
      }
    }
  ],
  server: {
    port: 5173
  }
});
