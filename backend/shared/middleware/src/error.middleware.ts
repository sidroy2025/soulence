import { Request, Response, NextFunction } from 'express';
import { AppError, logger } from '@soulence/utils';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Handle specific error types
  if (err.name === 'CastError') {
    error = new AppError(400, 'Invalid ID format');
  } else if (err.name === 'ValidationError') {
    error = new AppError(400, 'Validation error');
  } else if (err.name === 'MongoError' && (err as any).code === 11000) {
    error = new AppError(409, 'Duplicate field value');
  }

  if (error instanceof AppError) {
    logger.error('Operational error', {
      statusCode: error.statusCode,
      message: error.message,
      stack: error.stack
    });

    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    message: error.message,
    stack: error.stack
  });

  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      originalError: error.message,
      stack: error.stack
    })
  });
};