import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import tokenRoutes from './src/routes/tokenRoutes';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'POTLAUNCH Backend API',
    version: '1.0.0',
    status: 'running'
  });
});

// Routes
app.route('/api/tokens', tokenRoutes);

// Error handling
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