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
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

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
        service: 'auth-service',
        timestamp: new Date().toISOString()
      });
    });

    // Routes
    app.use('/api/v1/auth', authRouter);
    app.use('/api/v1/users', userRouter);

    // Error handling
    app.use(notFoundHandler);
    app.use(errorLogger);
    app.use(errorHandler);

    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });

  } catch (error) {
    logger.error('Failed to start auth service:', error);
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