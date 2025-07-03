import { Router } from 'express';
import { taskController } from '../controllers/task.controller';
import { authMiddleware } from '@soulence/middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Task CRUD routes
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task analytics routes
router.get('/statistics', taskController.getStatistics);
router.get('/upcoming', taskController.getUpcomingTasks);

export { router as taskRouter };