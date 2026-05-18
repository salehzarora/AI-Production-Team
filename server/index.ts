import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import imageRoutes from './routes/images';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/images', imageRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] running at http://localhost:${PORT}`);
  if (!process.env.IMAGE_API_KEY || !process.env.IMAGE_API_URL) {
    console.warn('[server] IMAGE_API_KEY / IMAGE_API_URL not set — running in placeholder mode.');
    console.warn('[server] Copy server/.env.example to server/.env and fill in your provider credentials.');
  }
});
