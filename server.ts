import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './api-server';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Safely get directory path in both CJS and ESM environments
const currentDir = typeof __dirname !== 'undefined' 
  ? __dirname 
  : (() => {
      const metaUrl = (import.meta as any)?.url;
      return metaUrl ? path.dirname(fileURLToPath(metaUrl)) : process.cwd();
    })();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Mount body parsers with generous limits BEFORE any other routes
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Router
  app.use('/api', apiRouter);

  if (process.env.NODE_ENV !== 'production') {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static assets in production
    const distPath = path.join(currentDir, 'dist');
    app.use(express.static(distPath));

    // Fallback to SPA router
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
