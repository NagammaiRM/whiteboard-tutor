import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
// @ts-ignore
import { handleTutorStream } from './server/router.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'whiteboard-tutor-api',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/health' && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok', version: '2.0.0' }));
            return;
          }
          if (req.url === '/api/providers' && req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              gemini: !!process.env.GEMINI_KEY,
              groq: !!process.env.GROQ_KEY,
              openrouter: !!process.env.OPENROUTER_KEY,
              builtIn: true
            }));
            return;
          }
          if (req.url === '/api/tutor' && req.method === 'POST') {
            let bodyStr = '';
            req.on('data', chunk => { bodyStr += chunk; });
            req.on('end', async () => {
              try {
                (req as any).body = bodyStr ? JSON.parse(bodyStr) : {};
                await handleTutorStream(req as any, res as any);
              } catch (e: any) {
                console.error('API Error:', e);
                if (!res.headersSent) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: e?.message || 'Server error' }));
                }
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
})
