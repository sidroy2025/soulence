import { Request, Response } from 'express';
import { logger } from '@soulence/utils';
import { academicStressService } from '../services/academic.stress.service';

export class AnalyticsController {
  /**
   * Get current academic stress level
   */
  async getStressLevel(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      const stressData = await academicStressService.getCurrentStressLevel(userId);
      
      if (!stressData) {
        // Calculate stress level if not found
        const calculatedStress = await academicStressService.calculateStressLevel(userId);
        
        res.json({
          success: true,
          data: calculatedStress
        });
        return;
      }
      
      res.json({
        success: true,
        data: stressData
      });
    } catch (error) {
      logger.error('Failed to get stress level:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get academic stress level'
      });
    }
  }

  /**
   * Get stress level trends over time
   */
  async getStressTrends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 30;
      
      if (days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          error: 'Days parameter must be between 1 and 365'
        });
        return;
      }
      
      const trends = await academicStressService.getStressTrends(userId, days);
      
      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      logger.error('Failed to get stress trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stress trends'
      });
    }
  }

  /**
   * Get academic performance analytics
   */
  async getPerformance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      // This would typically aggregate grade data, assignment completion rates, etc.
      // For now, we'll return basic performance metrics
      
      res.json({
        success: true,
        data: {
          message: 'Performance analytics coming soon'
        }
      });
    } catch (error) {
      logger.error('Failed to get performance analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance analytics'
      });
    }
  }

  /**
   * Get upcoming workload analysis
   */
  async getWorkload(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      // This would analyze upcoming assignments, due dates, and workload distribution
      // For now, we'll return basic workload metrics
      
      res.json({
        success: true,
        data: {
          message: 'Workload analysis coming soon'
        }
      });
    } catch (error) {
      logger.error('Failed to get workload analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workload analysis'
      });
    }
  }
}

export const analyticsController = new AnalyticsController();