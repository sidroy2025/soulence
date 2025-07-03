import { v4 as uuidv4 } from 'uuid';
import { Database, logger } from '@soulence/utils';
import { academicStressService } from './academic.stress.service';
import { addDays, isAfter, isBefore, differenceInHours } from 'date-fns';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  isFromCanvas: boolean;
  assignmentId?: string;
  courseId?: string;
  estimatedMinutes?: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  courseId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isFromCanvas?: boolean;
}

export class TaskService {
  /**
   * Get all tasks for a user with optional filters
   */
  async getUserTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    try {
      let query = `
        SELECT 
          t.id,
          t.user_id,
          t.title,
          t.description,
          t.due_date,
          t.priority,
          t.status,
          t.assignment_id,
          t.course_id,
          t.estimated_minutes,
          t.completed_at,
          t.created_at,
          t.updated_at,
          CASE 
            WHEN t.assignment_id IS NOT NULL THEN true 
            ELSE false 
          END as is_from_canvas
        FROM tasks t
        WHERE t.user_id = $1
      `;

      const params: any[] = [userId];
      let paramIndex = 2;

      // Apply filters
      if (filters) {
        if (filters.status) {
          query += ` AND t.status = $${paramIndex}`;
          params.push(filters.status);
          paramIndex++;
        }

        if (filters.priority) {
          query += ` AND t.priority = $${paramIndex}`;
          params.push(filters.priority);
          paramIndex++;
        }

        if (filters.courseId) {
          query += ` AND t.course_id = $${paramIndex}`;
          params.push(filters.courseId);
          paramIndex++;
        }

        if (filters.dueDateFrom) {
          query += ` AND t.due_date >= $${paramIndex}`;
          params.push(filters.dueDateFrom);
          paramIndex++;
        }

        if (filters.dueDateTo) {
          query += ` AND t.due_date <= $${paramIndex}`;
          params.push(filters.dueDateTo);
          paramIndex++;
        }

        if (filters.isFromCanvas !== undefined) {
          if (filters.isFromCanvas) {
            query += ` AND t.assignment_id IS NOT NULL`;
          } else {
            query += ` AND t.assignment_id IS NULL`;
          }
        }
      }

      query += ` ORDER BY 
        CASE 
          WHEN t.priority = 'high' THEN 1
          WHEN t.priority = 'medium' THEN 2
          ELSE 3
        END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
      `;

      const result = await Database.query(query, params);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        description: row.description,
        dueDate: row.due_date,
        priority: row.priority,
        status: row.status,
        isFromCanvas: row.is_from_canvas,
        assignmentId: row.assignment_id,
        courseId: row.course_id,
        estimatedMinutes: row.estimated_minutes,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      logger.error('Failed to get user tasks:', error);
      throw error;
    }
  }

  /**
   * Create a manual task (not from Canvas)
   */
  async createTask(userId: string, taskData: {
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    estimatedMinutes?: number;
  }): Promise<Task> {
    try {
      const id = uuidv4();
      const priority = taskData.priority || this.calculatePriority(taskData.dueDate);

      const query = `
        INSERT INTO tasks (
          id,
          user_id,
          title,
          description,
          due_date,
          priority,
          status,
          estimated_minutes,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'pending', $7, NOW(), NOW()
        )
        RETURNING *
      `;

      const result = await Database.query(query, [
        id,
        userId,
        taskData.title,
        taskData.description || null,
        taskData.dueDate || null,
        priority,
        taskData.estimatedMinutes || null
      ]);

      // Recalculate academic stress after adding task
      await academicStressService.calculateStressLevel(userId);

      const task = result.rows[0];
      logger.info('Created manual task', { userId, taskId: id });

      return {
        id: task.id,
        userId: task.user_id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority,
        status: task.status,
        isFromCanvas: false,
        estimatedMinutes: task.estimated_minutes,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      };
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(userId: string, taskId: string, updates: {
    title?: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in_progress' | 'completed';
    estimatedMinutes?: number;
  }): Promise<Task> {
    try {
      // Check if task belongs to user and is not from Canvas
      const checkQuery = `
        SELECT assignment_id 
        FROM tasks 
        WHERE id = $1 AND user_id = $2
      `;
      
      const checkResult = await Database.query(checkQuery, [taskId, userId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      if (checkResult.rows[0].assignment_id) {
        throw new Error('Cannot update Canvas-synced tasks');
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let valueIndex = 1;

      if (updates.title !== undefined) {
        updateFields.push(`title = $${valueIndex}`);
        updateValues.push(updates.title);
        valueIndex++;
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${valueIndex}`);
        updateValues.push(updates.description);
        valueIndex++;
      }

      if (updates.dueDate !== undefined) {
        updateFields.push(`due_date = $${valueIndex}`);
        updateValues.push(updates.dueDate);
        valueIndex++;
      }

      if (updates.priority !== undefined) {
        updateFields.push(`priority = $${valueIndex}`);
        updateValues.push(updates.priority);
        valueIndex++;
      }

      if (updates.status !== undefined) {
        updateFields.push(`status = $${valueIndex}`);
        updateValues.push(updates.status);
        valueIndex++;

        if (updates.status === 'completed') {
          updateFields.push(`completed_at = NOW()`);
        }
      }

      if (updates.estimatedMinutes !== undefined) {
        updateFields.push(`estimated_minutes = $${valueIndex}`);
        updateValues.push(updates.estimatedMinutes);
        valueIndex++;
      }

      updateFields.push('updated_at = NOW()');

      const query = `
        UPDATE tasks
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex} AND user_id = $${valueIndex + 1}
        RETURNING *
      `;

      updateValues.push(taskId, userId);

      const result = await Database.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      // Recalculate academic stress if status changed
      if (updates.status) {
        await academicStressService.calculateStressLevel(userId);
      }

      const task = result.rows[0];
      logger.info('Updated task', { userId, taskId });

      return {
        id: task.id,
        userId: task.user_id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority,
        status: task.status,
        isFromCanvas: false,
        estimatedMinutes: task.estimated_minutes,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at
      };
    } catch (error) {
      logger.error('Failed to update task:', error);
      throw error;
    }
  }

  /**
   * Delete a manual task
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      // Check if task belongs to user and is not from Canvas
      const checkQuery = `
        SELECT assignment_id 
        FROM tasks 
        WHERE id = $1 AND user_id = $2
      `;
      
      const checkResult = await Database.query(checkQuery, [taskId, userId]);
      
      if (checkResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      if (checkResult.rows[0].assignment_id) {
        throw new Error('Cannot delete Canvas-synced tasks');
      }

      const deleteQuery = `
        DELETE FROM tasks
        WHERE id = $1 AND user_id = $2
      `;

      await Database.query(deleteQuery, [taskId, userId]);

      // Recalculate academic stress after deleting task
      await academicStressService.calculateStressLevel(userId);

      logger.info('Deleted task', { userId, taskId });
    } catch (error) {
      logger.error('Failed to delete task:', error);
      throw error;
    }
  }

  /**
   * Get upcoming tasks for the next N days
   */
  async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
    const endDate = addDays(new Date(), days);
    
    return this.getUserTasks(userId, {
      status: 'pending',
      dueDateTo: endDate
    });
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    dueToday: number;
    dueThisWeek: number;
    completionRate: number;
  }> {
    try {
      const query = `
        WITH task_stats AS (
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'pending') as pending,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COUNT(*) FILTER (WHERE status != 'completed' AND due_date < NOW()) as overdue,
            COUNT(*) FILTER (WHERE DATE(due_date) = CURRENT_DATE) as due_today,
            COUNT(*) FILTER (WHERE due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') as due_this_week
          FROM tasks
          WHERE user_id = $1
        )
        SELECT 
          *,
          CASE 
            WHEN total > 0 THEN (completed::float / total::float) * 100
            ELSE 0
          END as completion_rate
        FROM task_stats
      `;

      const result = await Database.query(query, [userId]);
      const stats = result.rows[0];

      return {
        total: parseInt(stats.total),
        pending: parseInt(stats.pending),
        inProgress: parseInt(stats.in_progress),
        completed: parseInt(stats.completed),
        overdue: parseInt(stats.overdue),
        dueToday: parseInt(stats.due_today),
        dueThisWeek: parseInt(stats.due_this_week),
        completionRate: parseFloat(stats.completion_rate)
      };
    } catch (error) {
      logger.error('Failed to get task statistics:', error);
      throw error;
    }
  }

  /**
   * Calculate priority based on due date
   */
  private calculatePriority(dueDate?: Date): 'low' | 'medium' | 'high' {
    if (!dueDate) {
      return 'low';
    }

    const hoursUntilDue = differenceInHours(dueDate, new Date());

    if (hoursUntilDue <= 24) {
      return 'high';
    } else if (hoursUntilDue <= 72) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Sync Canvas assignments to tasks
   */
  async syncCanvasAssignmentsToTasks(userId: string): Promise<void> {
    try {
      const query = `
        INSERT INTO tasks (
          id,
          user_id,
          assignment_id,
          course_id,
          title,
          description,
          due_date,
          priority,
          status,
          created_at,
          updated_at
        )
        SELECT 
          a.id,
          a.user_id,
          a.id as assignment_id,
          a.course_id,
          a.title,
          a.description,
          a.due_date,
          a.priority,
          CASE 
            WHEN s.workflow_state = 'submitted' THEN 'completed'
            ELSE 'pending'
          END as status,
          NOW(),
          NOW()
        FROM assignments a
        LEFT JOIN assignment_submissions s ON a.id = s.assignment_id
        WHERE a.user_id = $1
          AND a.workflow_state = 'published'
        ON CONFLICT (assignment_id) 
        DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          due_date = EXCLUDED.due_date,
          priority = EXCLUDED.priority,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;

      await Database.query(query, [userId]);
      
      logger.info('Synced Canvas assignments to tasks', { userId });
    } catch (error) {
      logger.error('Failed to sync Canvas assignments to tasks:', error);
      throw error;
    }
  }
}

export const taskService = new TaskService();