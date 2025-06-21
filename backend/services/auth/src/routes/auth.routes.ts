import { Router } from 'express';
import { validate, validationSchemas } from '@soulence/utils';
import { authRateLimiter } from '@soulence/middleware';
import * as authController from '../controllers/auth.controller';

export const authRouter = Router();

// Public routes
authRouter.post(
  '/register',
  authRateLimiter,
  validate(validationSchemas.register),
  authController.register
);

authRouter.post(
  '/login',
  authRateLimiter,
  validate(validationSchemas.login),
  authController.login
);

authRouter.post(
  '/refresh',
  authController.refreshToken
);

authRouter.post(
  '/forgot-password',
  authRateLimiter,
  authController.forgotPassword
);

authRouter.post(
  '/reset-password',
  authRateLimiter,
  authController.resetPassword
);

authRouter.post(
  '/verify-email/:token',
  authController.verifyEmail
);

// Protected routes
authRouter.post(
  '/logout',
  authController.logout
);