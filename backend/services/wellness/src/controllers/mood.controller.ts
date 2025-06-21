import { Request, Response } from 'express';
import { 
  asyncHandler, 
  logger,
  ValidationError,
  NotFoundError
} from '@soulence/utils';
import * as moodService from '../services/mood.service';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../types';

// Log a new mood entry
export const logMood = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { moodScore, emotions, notes } = req.body;

  // Validate mood score
  if (moodScore < 1 || moodScore > 10) {
    throw new ValidationError('Mood score must be between 1 and 10');
  }

  // Create mood log
  const moodLog = await moodService.createMoodLog({
    userId,
    moodScore,
    emotions: emotions || [],
    notes: notes || null
  });

  // Check for crisis (score <= 3)
  if (moodScore <= 3) {
    await moodService.triggerCrisisProtocol(userId, moodLog);
  }

  // Log to time-series database for analytics
  await moodService.logToTimeSeries(userId, moodScore);

  res.status(201).json({
    status: 'success',
    message: 'Mood logged successfully',
    data: {
      moodLog
    }
  });
});

// Get mood history for a user
export const getMoodHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { startDate, endDate, limit = 30 } = req.query;

  const moodLogs = await moodService.getMoodHistory(
    userId,
    startDate as string,
    endDate as string,
    Number(limit)
  );

  // Calculate statistics
  const stats = await moodService.calculateMoodStats(moodLogs);

  res.json({
    status: 'success',
    data: {
      moodLogs,
      stats
    }
  });
});

// Get today's mood
export const getTodayMood = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  
  const todayMood = await moodService.getTodayMood(userId);

  res.json({
    status: 'success',
    data: {
      hasMoodToday: !!todayMood,
      mood: todayMood
    }
  });
});

// Get mood trends and insights
export const getMoodTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { period = '7d' } = req.query;

  const trends = await moodService.analyzeMoodTrends(userId, period as string);
  const insights = await moodService.generateInsights(userId, trends);

  res.json({
    status: 'success',
    data: {
      trends,
      insights
    }
  });
});

// Update a mood log (within 1 hour of creation)
export const updateMoodLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { moodId } = req.params;
  const { moodScore, emotions, notes } = req.body;

  // Verify ownership and time constraint
  const canUpdate = await moodService.canUpdateMoodLog(userId, moodId);
  if (!canUpdate) {
    throw new ValidationError('Cannot update mood log. Either not owner or past time limit.');
  }

  const updatedMood = await moodService.updateMoodLog(moodId, {
    moodScore,
    emotions,
    notes
  });

  res.json({
    status: 'success',
    message: 'Mood updated successfully',
    data: {
      moodLog: updatedMood
    }
  });
});

// Delete a mood log (admin or within 1 hour)
export const deleteMoodLog = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role;
  const { moodId } = req.params;

  // Check permissions
  const canDelete = await moodService.canDeleteMoodLog(userId, userRole, moodId);
  if (!canDelete) {
    throw new ValidationError('Cannot delete mood log');
  }

  await moodService.deleteMoodLog(moodId);

  res.json({
    status: 'success',
    message: 'Mood log deleted successfully'
  });
});