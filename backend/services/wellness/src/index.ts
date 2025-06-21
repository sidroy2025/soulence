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
import { moodRouter } from './routes/mood.routes';
import { crisisRouter } from './routes/crisis.routes';

const app = express();
const PORT = process.env.WELLNESS_SERVICE_PORT || 3002;

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

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'wellness-service',
        timestamp: new Date().toISOString()
      });
    });

    // Routes
    app.use('/api/v1/mood', moodRouter);
    app.use('/api/v1/crisis', crisisRouter);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorLogger);
    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Wellness service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start wellness service:', error);
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