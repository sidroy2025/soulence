import { Router } from 'express';
import { authenticate, authorize } from '@soulence/middleware';
import { UserRole } from '@soulence/models';
import * as userController from '../controllers/user.controller';

export const userRouter = Router();

// All routes require authentication
userRouter.use(authenticate);

// User profile routes
userRouter.get('/profile', userController.getProfile);
userRouter.put('/profile', userController.updateProfile);
userRouter.delete('/profile', userController.deleteAccount);

// Consent management
userRouter.get('/consents', userController.getConsents);
userRouter.post('/consents', userController.grantConsent);
userRouter.delete('/consents/:id', userController.revokeConsent);

// Parent-specific routes
userRouter.get(
  '/children',
  authorize(UserRole.PARENT),
  userController.getChildren
);

userRouter.post(
  '/children/:childId/link',
  authorize(UserRole.PARENT),
  userController.linkChild
);

// Therapist-specific routes
userRouter.get(
  '/patients',
  authorize(UserRole.THERAPIST),
  userController.getPatients
);

// Admin routes (if needed)
userRouter.get(
  '/all',
  authorize(UserRole.THERAPIST), // Assuming therapists have admin-like access
  userController.getAllUsers
);