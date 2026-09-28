import express from 'express';
import path from 'path';
import { apiRouter } from './src/server/routes';

const app = express();
const PORT = process.env.PORT || 3000;

// JSON middleware
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Construction Site Management System' });
});

// Mount API Router
app.use('/api', apiRouter);

// TẠM THỜI BỎ HẲN CÁC HÀM SEED TỰ ĐỘNG KHI KHỞI ĐỘNG SERVER
// Điều này giúp server khởi động thành công 100% lên trạng thái Live mà không bị nghẽn mạng với Supabase.

// Production static files serving
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Lắng nghe cổng PORT để chạy độc lập trên Render
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Construction Management System server running on port ${PORT}`);
});