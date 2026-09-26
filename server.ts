import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './src/server/routes.ts';
import { seedDatabase, seedMachineryIfEmpty } from './src/db/seed.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Construction Site Management System' });
  });

  // Mount API Router
  app.use('/api', apiRouter);

  // Initialize and seed database if necessary
  try {
    await seedDatabase();
    await seedMachineryIfEmpty();
  } catch (err) {
    console.error('Failed to seed initial data:', err);
  }

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Construction Management System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
