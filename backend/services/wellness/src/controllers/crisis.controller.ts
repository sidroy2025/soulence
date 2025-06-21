import { Request, Response } from 'express';
import { asyncHandler } from '@soulence/utils';
import * as crisisService from '../services/crisis.service';
import { AuthRequest } from '../types';

// Get crisis resources and helplines
export const getCrisisResources = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Make these configurable per region
  const resources = {
    helplines: [
      {
        name: "National Suicide Prevention Lifeline",
        number: "988",
        available: "24/7",
        description: "Free and confidential support"
      },
      {
        name: "Crisis Text Line",
        number: "Text HOME to 741741",
        available: "24/7",
        description: "Text-based crisis support"
      }
    ],
    tips: [
      "Take deep breaths - inhale for 4, hold for 4, exhale for 4",
      "Reach out to someone you trust",
      "Go for a walk or do light exercise",
      "Write down your feelings in a journal",
      "Listen to calming music"
    ],
    emergencyMessage: "If you're in immediate danger, please call 911 or go to your nearest emergency room."
  };

  res.json({
    status: 'success',
    data: resources
  });
});

// Get user's crisis alert history
export const getCrisisHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { limit = 10 } = req.query;
  
  const history = await crisisService.getCrisisHistory(userId, Number(limit));
  
  res.json({
    status: 'success',
    data: {
      alerts: history,
      count: history.length
    }
  });
});

// Get crisis statistics (therapists only)
export const getCrisisStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, days = 30 } = req.query;
  
  // TODO: Verify therapist has access to this user
  
  const stats = await crisisService.getCrisisStats(
    userId as string, 
    Number(days)
  );
  
  res.json({
    status: 'success',
    data: stats
  });
});

// Manual crisis report
export const reportCrisis = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { severityLevel, description } = req.body;
  
  await crisisService.createCrisisAlert({
    userId,
    severityLevel: severityLevel || 5,
    triggerPattern: `Manual report: ${description}`,
    emotions: []
  });
  
  res.status(201).json({
    status: 'success',
    message: 'Crisis report submitted. Help is on the way.',
    data: {
      resources: {
        immediate: "If you need immediate help, call 988",
        text: "Text HOME to 741741 for support"
      }
    }
  });
});