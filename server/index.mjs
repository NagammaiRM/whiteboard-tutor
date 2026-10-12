// server/index.mjs
// Express server runtime for Whiteboard Tutor backend & Cloud Run deployment
import express from 'express';
import cors from 'cors';
import { handleTutorStream } from './router.mjs';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    mode: 'Whiteboard Tutor Server Runtime',
    timestamp: new Date().toISOString()
  });
});

// Providers configuration status check (hides actual secret keys)
app.get('/api/providers', (req, res) => {
  res.json({
    gemini: !!(process.env.GEMINI_KEY || process.env.VITE_GEMINI_KEY),
    groq: !!(process.env.GROQ_KEY || process.env.VITE_GROQ_KEY),
    openrouter: !!(process.env.OPENROUTER_KEY || process.env.VITE_OPENROUTER_KEY),
    chromeAI: true
  });
});

// LLM Proxy Streaming Router
app.post('/api/tutor', async (req, res) => {
  try {
    await handleTutorStream(req, res);
  } catch (error) {
    console.error('Error handling tutor request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  }
});

// Standalone runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Whiteboard Tutor Server listening on http://localhost:${PORT}`);
  });
}

export default app;
