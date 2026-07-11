import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRouter from './api-server.js'; // Use .js extension for TS type stripping runtime compatibility if required, or import directly
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// API Router
app.use('/api', apiRouter);

// Serve static assets in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback to SPA router
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Production server running on port ${port}`);
});
