// Interventions Routes
// Sleep intervention management endpoints

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { Request, Response } from 'express';

const router = Router();

// Apply authentication middleware
router.use(authMiddleware);

// Get user's interventions
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const status = req.query.status as string;
    
    // TODO: Implement interventions service
    res.json({
      success: true,
      data: [
        {
          id: 'int-1',
          type: 'bedtime_reminder',
          title: 'Bedtime Consistency',
          message: 'Consider setting a consistent bedtime to improve your sleep quality',
          severity: 'medium',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ],
      message: 'Sleep interventions retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving interventions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Acknowledge an intervention
router.put('/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const interventionId = req.params.id;
    
    // TODO: Update intervention status
    res.json({
      success: true,
      message: 'Intervention acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging intervention:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Complete an intervention
router.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const interventionId = req.params.id;
    const { rating, feedback } = req.body;
    
    // TODO: Update intervention status and collect feedback
    res.json({
      success: true,
      message: 'Intervention completed successfully'
    });
  } catch (error) {
    console.error('Error completing intervention:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export { router as interventionsRouter };