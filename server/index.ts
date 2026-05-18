import path from 'path';
import dotenv from 'dotenv';

// Load .env from the server/ directory explicitly — safe regardless of where the
// process is launched from.
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import imageRoutes from './routes/images';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/images', imageRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    requiresAccessKey: Boolean(process.env.APP_ACCESS_KEY),
  });
});

app.listen(PORT, () => {
  const provider = (process.env.IMAGE_PROVIDER ?? '').trim() || '(not set — placeholder mode)';
  const keyLoaded = Boolean(process.env.IMAGE_API_KEY);
  const model = (process.env.IMAGE_MODEL ?? 'gpt-image-1').trim();
  const rateLimitWindow = process.env.IMAGE_RATE_LIMIT_WINDOW_MINUTES ?? '60';
  const rateLimitMax = process.env.IMAGE_RATE_LIMIT_MAX ?? '5';

  console.log(`[server] running at http://localhost:${PORT}`);
  console.log(`[server] IMAGE_PROVIDER=${provider}`);
  console.log(`[server] IMAGE_API_KEY loaded=${keyLoaded}`);
  console.log(`[server] IMAGE_MODEL=${model}`);
  console.log(`[server] rate limit=${rateLimitMax} req / ${rateLimitWindow} min per IP`);
  console.log(`[server] access key protection=${Boolean(process.env.APP_ACCESS_KEY)}`);

  if (!process.env.IMAGE_PROVIDER) {
    console.warn('[server] IMAGE_PROVIDER is not set — running in placeholder mode.');
    console.warn('[server] Set IMAGE_PROVIDER=openai (or another provider) in server/.env.');
  }
});
