// Sleep Controller
// Handles sleep session CRUD operations and basic sleep tracking

import { Request, Response } from 'express';
import { sleepService } from '../services/sleep.service';
import { 
  CreateSleepSessionRequest, 
  UpdateSleepSessionRequest,
  GetSleepSessionsParams,
  SleepServiceResponse 
} from '../types/sleep.types';
import Joi from 'joi';

// Validation schemas
const createSessionSchema = Joi.object({
  sessionDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  bedtime: Joi.string().isoDate().optional(),
  sleepOnset: Joi.string().isoDate().optional(),
  wakeTime: Joi.string().isoDate().optional(),
  getUpTime: Joi.string().isoDate().optional(),
  qualityScore: Joi.number().min(1).max(10).optional(),
  energyLevel: Joi.number().min(1).max(10).optional(),
  moodUponWaking: Joi.string().max(50).optional(),
  caffeineAfter2pm: Joi.boolean().optional(),
  alcoholConsumed: Joi.boolean().optional(),
  exerciseDay: Joi.boolean().optional(),
  screenTimeBeforeBed: Joi.number().min(0).max(1440).optional(), // max 24 hours
  roomTemperature: Joi.string().valid('cold', 'cool', 'comfortable', 'warm', 'hot').optional(),
  stressLevelBeforeBed: Joi.number().min(1).max(10).optional(),
  notes: Joi.string().max(1000).optional(),
});

const updateSessionSchema = Joi.object({
  sessionDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bedtime: Joi.string().isoDate().optional(),
  sleepOnset: Joi.string().isoDate().optional(),
  wakeTime: Joi.string().isoDate().optional(),
  getUpTime: Joi.string().isoDate().optional(),
  qualityScore: Joi.number().min(1).max(10).optional(),
  energyLevel: Joi.number().min(1).max(10).optional(),
  moodUponWaking: Joi.string().max(50).optional(),
  caffeineAfter2pm: Joi.boolean().optional(),
  alcoholConsumed: Joi.boolean().optional(),
  exerciseDay: Joi.boolean().optional(),
  screenTimeBeforeBed: Joi.number().min(0).max(1440).optional(),
  roomTemperature: Joi.string().valid('cold', 'cool', 'comfortable', 'warm', 'hot').optional(),
  stressLevelBeforeBed: Joi.number().min(1).max(10).optional(),
  notes: Joi.string().max(1000).optional(),
});

const getSessionsParamsSchema = Joi.object({
  startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  qualityFilter: Joi.string().valid('poor', 'fair', 'good', 'excellent').optional(),
  durationFilter: Joi.string().valid('insufficient', 'short', 'normal', 'long').optional(),
});

class SleepController {
  /**
   * Create a new sleep session
   */
  async createSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      // Validate request body
      const { error, value } = createSessionSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const sessionData: CreateSleepSessionRequest = value;
      const session = await sleepService.createSession(userId, sessionData);

      res.status(201).json({
        success: true,
        data: session,
        message: 'Sleep session created successfully'
      });
    } catch (error) {
      console.error('Error creating sleep session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create sleep session'
      });
    }
  }

  /**
   * Get sleep sessions for a user
   */
  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      // Validate query parameters
      const { error, value } = getSessionsParamsSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const params: GetSleepSessionsParams = value;
      const result = await sleepService.getSessions(userId, params);

      res.status(200).json({
        success: true,
        data: result.sessions,
        pagination: result.pagination,
        message: 'Sleep sessions retrieved successfully'
      });
    } catch (error) {
      console.error('Error retrieving sleep sessions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sleep sessions'
      });
    }
  }

  /**
   * Get a specific sleep session by ID
   */
  async getSessionById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Session ID is required'
        });
        return;
      }

      const session = await sleepService.getSessionById(userId, sessionId);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Sleep session not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: session,
        message: 'Sleep session retrieved successfully'
      });
    } catch (error) {
      console.error('Error retrieving sleep session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sleep session'
      });
    }
  }

  /**
   * Update a sleep session
   */
  async updateSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Session ID is required'
        });
        return;
      }

      // Validate request body
      const { error, value } = updateSessionSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          message: error.details[0].message
        });
        return;
      }

      const updateData: UpdateSleepSessionRequest = { ...value, id: sessionId };
      const session = await sleepService.updateSession(userId, updateData);

      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Sleep session not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: session,
        message: 'Sleep session updated successfully'
      });
    } catch (error) {
      console.error('Error updating sleep session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update sleep session'
      });
    }
  }

  /**
   * Delete a sleep session
   */
  async deleteSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.params.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      if (!sessionId) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Session ID is required'
        });
        return;
      }

      const deleted = await sleepService.deleteSession(userId, sessionId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: 'Sleep session not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Sleep session deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting sleep session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete sleep session'
      });
    }
  }

  /**
   * Get today's sleep session (if exists)
   */
  async getTodaysSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const session = await sleepService.getSessionByDate(userId, today);

      res.status(200).json({
        success: true,
        data: session,
        message: session ? "Today's sleep session retrieved" : "No sleep session logged for today"
      });
    } catch (error) {
      console.error('Error retrieving today\'s sleep session:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve today\'s sleep session'
      });
    }
  }

  /**
   * Get sleep session by specific date
   */
  async getSessionByDate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const date = req.params.date;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
        return;
      }

      const session = await sleepService.getSessionByDate(userId, date);

      res.status(200).json({
        success: true,
        data: session,
        message: session ? 'Sleep session retrieved successfully' : 'No sleep session found for this date'
      });
    } catch (error) {
      console.error('Error retrieving sleep session by date:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sleep session'
      });
    }
  }

  /**
   * Get sleep summary for recent period
   */
  async getRecentSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required'
        });
        return;
      }

      const days = parseInt(req.query.days as string) || 7;
      if (days < 1 || days > 90) {
        res.status(400).json({
          success: false,
          error: 'Bad request',
          message: 'Days parameter must be between 1 and 90'
        });
        return;
      }

      const summary = await sleepService.getRecentSummary(userId, days);

      res.status(200).json({
        success: true,
        data: summary,
        message: `Sleep summary for last ${days} days retrieved successfully`
      });
    } catch (error) {
      console.error('Error retrieving sleep summary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve sleep summary'
      });
    }
  }
}

export const sleepController = new SleepController();