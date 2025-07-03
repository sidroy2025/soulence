import express from 'express';
import { config, Database, Cache, logger, validateConfig } from '@soulence/utils';
import { 
  securityMiddleware, 
  corsMiddleware, 
  compressionMiddleware, 
  requestLogger, 
  errorLogger,
  errorHandler,
  notFoundHandler 
} from '@soulence/middleware';
import { canvasRouter } from './routes/canvas.routes';
import { taskRouter } from './routes/task.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { startSyncScheduler } from './services/sync.scheduler';

const app = express();
const PORT = process.env.ACADEMIC_SERVICE_PORT || 3003;

async function startServer() {
  try {
    // Validate configuration
    validateConfig();

    // Initialize database connections
    await Database.initialize();
    await Cache.initialize();

    // Apply middleware
    app.use(securityMiddleware);
    app.use(corsMiddleware);
    app.use(compressionMiddleware);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(requestLogger);

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'academic-service',
        timestamp: new Date().toISOString()
      });
    });

    // Routes
    app.use('/api/v1/academic/canvas', canvasRouter);
    app.use('/api/v1/academic/tasks', taskRouter);
    app.use('/api/v1/academic/analytics', analyticsRouter);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorLogger);
    app.use(errorHandler);

    // Start the sync scheduler
    startSyncScheduler();

    app.listen(PORT, () => {
      logger.info(`Academic service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start academic service:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await Database.close();
  await Cache.close();
  process.exit(0);
});

startServer();