import { Router } from 'express';
import { authenticate, authorize, validate } from '@soulence/middleware';
import { UserRole } from '@soulence/models';
import * as moodController from '../controllers/mood.controller';
import { moodValidation } from '../utils/validation';

export const moodRouter = Router();

// All mood routes require authentication
moodRouter.use(authenticate);

// Log a new mood (students only)
moodRouter.post(
  '/',
  authorize([UserRole.STUDENT]),
  validate(moodValidation.logMood),
  moodController.logMood
);

// Get mood history (students see own, therapists/parents see assigned)
moodRouter.get(
  '/history',
  authorize([UserRole.STUDENT, UserRole.PARENT, UserRole.THERAPIST]),
  moodController.getMoodHistory
);

// Get today's mood
moodRouter.get(
  '/today',
  authorize([UserRole.STUDENT]),
  moodController.getTodayMood
);

// Get mood trends and insights
moodRouter.get(
  '/trends',
  authorize([UserRole.STUDENT, UserRole.PARENT, UserRole.THERAPIST]),
  moodController.getMoodTrends
);

// Update a mood log (within 1 hour)
moodRouter.put(
  '/:moodId',
  authorize([UserRole.STUDENT]),
  validate(moodValidation.updateMood),
  moodController.updateMoodLog
);

// Delete a mood log
moodRouter.delete(
  '/:moodId',
  authorize([UserRole.STUDENT, UserRole.THERAPIST]),
  moodController.deleteMoodLog
);