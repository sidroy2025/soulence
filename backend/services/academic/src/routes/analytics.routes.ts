import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '@soulence/middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Academic analytics routes
router.get('/stress-level', analyticsController.getStressLevel);
router.get('/stress-trends', analyticsController.getStressTrends);
router.get('/performance', analyticsController.getPerformance);
router.get('/workload', analyticsController.getWorkload);

export { router as analyticsRouter };