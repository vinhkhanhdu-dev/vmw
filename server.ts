import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { processUserMessage } from './src/server/botHandler';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Allow the Android app (served from https://localhost) to call the API
app.use('/api', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

import { handleApiRequest } from './src/server/apiRouter';

app.all('/api/*', async (req, res) => {
  try {
    const { status, data } = await handleApiRequest(
      req.method,
      req.path,
      req.body,
      req.query
    );
    res.status(status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Server error' });
  }
});

// Serve dist for production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mỹ Vinh Wedding Assistant Server running on port ${PORT}`);
});
