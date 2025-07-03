// Sleep Service Entry Point
// Soulence Phase 2B: Sleep Monitoring Integration

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { sleepRouter } from './routes/sleep.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { correlationsRouter } from './routes/correlations.routes';
import { interventionsRouter } from './routes/interventions.routes';
import { insightsRouter } from './routes/insights.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SLEEP_SERVICE_PORT || 3006;

// Database connection
export const db = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'soulence',
  user: process.env.POSTGRES_USER || 'soulence_user',
  password: process.env.POSTGRES_PASSWORD || 'soulence_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis connection
export const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Connect to Redis
redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis');
});

// Test database connection
db.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  } else {
    console.log('✅ Connected to PostgreSQL database');
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'sleep-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: PORT,
  });
});

// API Routes
app.use('/api/v1/sleep', sleepRouter);
app.use('/api/v1/sleep/analytics', analyticsRouter);
app.use('/api/v1/sleep/correlations', correlationsRouter);
app.use('/api/v1/sleep/interventions', interventionsRouter);
app.use('/api/v1/sleep/insights', insightsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Soulence Sleep Service',
    description: 'Sleep pattern monitoring and analysis service',
    version: '1.0.0',
    phase: '2B - Sleep Monitoring Integration',
    endpoints: {
      health: '/health',
      sleep: '/api/v1/sleep',
      analytics: '/api/v1/sleep/analytics',
      correlations: '/api/v1/sleep/correlations',
      interventions: '/api/v1/sleep/interventions',
      insights: '/api/v1/sleep/insights',
    },
    features: [
      'Sleep session tracking and analysis',
      'Sleep pattern detection and classification',
      'Sleep-mood-academic correlations',
      'Intelligent intervention recommendations',
      'Personalized sleep insights',
      'Cross-service wellness integration'
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🔄 Received shutdown signal, closing connections...');
  
  try {
    await db.end();
    console.log('✅ Database connection closed');
    
    await redis.quit();
    console.log('✅ Redis connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🌙 ================================');
  console.log('🌙  Soulence Sleep Service');
  console.log('🌙  Phase 2B: Sleep Monitoring');
  console.log('🌙 ================================');
  console.log(`🌙  Server running on port ${PORT}`);
  console.log(`🌙  Health check: http://localhost:${PORT}/health`);
  console.log(`🌙  API Base: http://localhost:${PORT}/api/v1/sleep`);
  console.log('🌙 ================================');
  console.log('');
});

export default app;