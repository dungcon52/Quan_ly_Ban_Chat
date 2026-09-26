import express from 'express';
import path from 'path';
import { apiRouter } from './src/server/routes';
import { seedDatabase, seedMachineryIfEmpty } from './src/db/seed';

const app = express();

// JSON middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Construction Site Management System' });
});

// Mount API Router
app.use('/api', apiRouter);

// Initialize and seed database if necessary (chạy bất đồng bộ ngầm không chặn khởi động serverless)
seedDatabase().catch((err) => console.error('Failed to seed initial data:', err));
seedMachineryIfEmpty().catch((err) => console.error('Failed to seed machinery:', err));

// Static build serving for production on Vercel
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Export app để Vercel chạy dưới dạng Serverless Function (Không dùng app.listen)
export default app;