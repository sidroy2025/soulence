import { Request, Response } from 'express';
import Joi from 'joi';
import { logger } from '@soulence/utils';
import { taskService, TaskFilters } from '../services/task.service';

const createTaskSchema = Joi.object({
  title: Joi.string().required().min(1).max(255),
  description: Joi.string().optional().allow('').max(1000),
  dueDate: Joi.date().optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  estimatedMinutes: Joi.number().integer().min(1).max(1440).optional()
});

const updateTaskSchema = Joi.object({
  title: Joi.string().optional().min(1).max(255),
  description: Joi.string().optional().allow('').max(1000),
  dueDate: Joi.date().optional().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
  estimatedMinutes: Joi.number().integer().min(1).max(1440).optional().allow(null)
});

export class TaskController {
  /**
   * Get user tasks with optional filters
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      // Parse query filters
      const filters: TaskFilters = {};
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      if (req.query.priority) {
        filters.priority = req.query.priority as string;
      }
      
      if (req.query.courseId) {
        filters.courseId = req.query.courseId as string;
      }
      
      if (req.query.dueDateFrom) {
        filters.dueDateFrom = new Date(req.query.dueDateFrom as string);
      }
      
      if (req.query.dueDateTo) {
        filters.dueDateTo = new Date(req.query.dueDateTo as string);
      }
      
      if (req.query.isFromCanvas !== undefined) {
        filters.isFromCanvas = req.query.isFromCanvas === 'true';
      }
      
      const tasks = await taskService.getUserTasks(userId, filters);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Failed to get tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve tasks'
      });
    }
  }

  /**
   * Create a new manual task
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createTaskSchema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }
      
      const userId = req.user.id;
      const task = await taskService.createTask(userId, value);
      
      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Failed to create task:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create task'
      });
    }
  }

  /**
   * Update a task
   */
  async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateTaskSchema.validate(req.body);
      
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }
      
      const userId = req.user.id;
      const taskId = req.params.id;
      
      const task = await taskService.updateTask(userId, taskId, value);
      
      res.json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Failed to update task:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof Error && error.message.includes('Canvas-synced')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to update task'
        });
      }
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const taskId = req.params.id;
      
      await taskService.deleteTask(userId, taskId);
      
      res.json({
        success: true,
        data: {
          message: 'Task deleted successfully'
        }
      });
    } catch (error) {
      logger.error('Failed to delete task:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
      } else if (error instanceof Error && error.message.includes('Canvas-synced')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to delete task'
        });
      }
    }
  }

  /**
   * Get task statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      
      const statistics = await taskService.getTaskStatistics(userId);
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      logger.error('Failed to get task statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get task statistics'
      });
    }
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 7;
      
      if (days < 1 || days > 365) {
        res.status(400).json({
          success: false,
          error: 'Days parameter must be between 1 and 365'
        });
        return;
      }
      
      const tasks = await taskService.getUpcomingTasks(userId, days);
      
      res.json({
        success: true,
        data: tasks
      });
    } catch (error) {
      logger.error('Failed to get upcoming tasks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get upcoming tasks'
      });
    }
  }
}

export const taskController = new TaskController();