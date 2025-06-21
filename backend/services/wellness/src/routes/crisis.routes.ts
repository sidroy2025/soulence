import { Router } from 'express';
import { authenticate, authorize } from '@soulence/middleware';
import { UserRole } from '@soulence/models';
import * as crisisController from '../controllers/crisis.controller';

export const crisisRouter = Router();

// All crisis routes require authentication
crisisRouter.use(authenticate);

// Get crisis resources (available to all)
crisisRouter.get(
  '/resources',
  crisisController.getCrisisResources
);

// Get crisis history (students see own, therapists see patients)
crisisRouter.get(
  '/history',
  authorize([UserRole.STUDENT, UserRole.THERAPIST]),
  crisisController.getCrisisHistory
);

// Get crisis statistics
crisisRouter.get(
  '/stats',
  authorize([UserRole.THERAPIST]),
  crisisController.getCrisisStats
);

// Manual crisis report (students only)
crisisRouter.post(
  '/report',
  authorize([UserRole.STUDENT]),
  crisisController.reportCrisis
);