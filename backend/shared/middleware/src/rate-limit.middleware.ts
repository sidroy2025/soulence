import rateLimit from 'express-rate-limit';
import { RateLimitError } from '@soulence/utils';

export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options?.max || 100,
    message: options?.message || 'Too many requests from this IP',
    handler: (req, res) => {
      throw new RateLimitError(options?.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Specific rate limiters for different endpoints
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded'
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: 'AI request limit exceeded'
});