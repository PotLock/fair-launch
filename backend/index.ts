import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import tokenRoutes from './src/routes/tokenRoutes';
import ipfsRoutes from './src/routes/ipfsRoutes';
import halfbakRoutes from './src/routes/halfbakRoutes';
import transactionRoutes from './src/routes/transactionRoutes';

const app = new Hono();

app.use(cors());

app.get('/', (c) => {
  return c.json({
    message: 'POTLAUNCH Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

app.route('/api/tokens', tokenRoutes);
app.route('/api/ipfs', ipfsRoutes);
app.route('/api/halfbak', halfbakRoutes);
app.route('/api/transactions', transactionRoutes);


app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({
    success: false,
    message: 'Internal server error'
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    message: 'Route not found'
  }, 404);
});

const port = process.env.PORT || 3001;

console.log(`🚀 Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: parseInt(port.toString()),
});
