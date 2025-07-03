import { Database, logger } from '@soulence/utils';
import { canvasAuthService } from './canvas.auth.service';
import { academicStressService } from './academic.stress.service';
import {
  CanvasCourse,
  CanvasAssignment,
  CanvasSubmission,
  CanvasSyncStatus
} from '../types/canvas.types';

export class CanvasSyncService {
  /**
   * Sync all Canvas data for a user
   */
  async syncUserData(userId: string): Promise<CanvasSyncStatus> {
    const startTime = Date.now();
    const syncErrors: string[] = [];
    
    try {
      logger.info('Starting Canvas sync for user', { userId });

      // Check if user has active Canvas connection
      const connectionStatus = await canvasAuthService.getConnectionStatus(userId);
      if (!connectionStatus.isConnected) {
        throw new Error('User does not have an active Canvas connection');
      }

      // Sync courses
      const courses = await this.syncCourses(userId);
      
      // Sync assignments for each course
      let totalAssignments = 0;
      for (const course of courses) {
        try {
          const assignments = await this.syncCourseAssignments(userId, course);
          totalAssignments += assignments.length;
        } catch (error) {
          const errorMsg = `Failed to sync assignments for course ${course.id}`;
          logger.error(errorMsg, error);
          syncErrors.push(errorMsg);
        }
      }

      // Update last synced timestamp
      await this.updateLastSyncedAt(userId);

      // Calculate academic stress after sync
      await academicStressService.calculateStressLevel(userId);

      const syncTime = Date.now() - startTime;
      logger.info('Canvas sync completed', { 
        userId, 
        courses: courses.length, 
        assignments: totalAssignments,
        syncTime,
        errors: syncErrors.length 
      });

      return {
        userId,
        lastSyncedAt: new Date(),
        isConnected: true,
        totalCourses: courses.length,
        totalAssignments,
        syncErrors: syncErrors.length > 0 ? syncErrors : undefined
      };
    } catch (error) {
      logger.error('Canvas sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync courses from Canvas
   */
  private async syncCourses(userId: string): Promise<CanvasCourse[]> {
    try {
      // Get current courses from Canvas
      const canvasCourses = await canvasAuthService.makeCanvasRequest<CanvasCourse[]>(
        userId,
        '/api/v1/courses?enrollment_state=active&include[]=teachers&include[]=term'
      );

      if (!canvasCourses) {
        return [];
      }

      // Sync each course to database
      for (const course of canvasCourses) {
        await this.upsertCourse(userId, course);
      }

      return canvasCourses;
    } catch (error) {
      logger.error('Failed to sync courses:', error);
      throw new Error('Failed to sync Canvas courses');
    }
  }

  /**
   * Upsert course in database
   */
  private async upsertCourse(userId: string, course: CanvasCourse): Promise<void> {
    const query = `
      INSERT INTO courses (
        id,
        user_id,
        canvas_id,
        name,
        course_code,
        term,
        teachers,
        workflow_state,
        start_date,
        end_date,
        last_synced
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
      ON CONFLICT (canvas_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        course_code = EXCLUDED.course_code,
        term = EXCLUDED.term,
        teachers = EXCLUDED.teachers,
        workflow_state = EXCLUDED.workflow_state,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        last_synced = NOW()
      RETURNING id
    `;

    const teachers = course.teachers ? 
      JSON.stringify(course.teachers.map(t => ({ id: t.id, name: t.name, email: t.email }))) : 
      null;

    await Database.query(query, [
      userId,
      course.id.toString(),
      course.name,
      course.course_code,
      course.enrollment_term_id?.toString() || null,
      teachers,
      course.workflow_state,
      course.start_at ? new Date(course.start_at) : null,
      course.end_at ? new Date(course.end_at) : null
    ]);
  }

  /**
   * Sync assignments for a course
   */
  private async syncCourseAssignments(userId: string, course: CanvasCourse): Promise<CanvasAssignment[]> {
    try {
      // Get assignments from Canvas
      const assignments = await canvasAuthService.makeCanvasRequest<CanvasAssignment[]>(
        userId,
        `/api/v1/courses/${course.id}/assignments?include[]=submission&order_by=due_at`
      );

      if (!assignments) {
        return [];
      }

      // Get course ID from our database
      const courseResult = await Database.query(
        'SELECT id FROM courses WHERE canvas_id = $1',
        [course.id.toString()]
      );

      if (courseResult.rows.length === 0) {
        throw new Error(`Course not found in database: ${course.id}`);
      }

      const courseId = courseResult.rows[0].id;

      // Sync each assignment
      for (const assignment of assignments) {
        await this.upsertAssignment(userId, courseId, assignment);
        
        // Sync submission if exists
        if (assignment.submission) {
          await this.upsertSubmission(userId, assignment.id.toString(), assignment.submission);
        }
      }

      return assignments;
    } catch (error) {
      logger.error('Failed to sync course assignments:', error);
      throw error;
    }
  }

  /**
   * Upsert assignment in database
   */
  private async upsertAssignment(userId: string, courseId: string, assignment: CanvasAssignment): Promise<void> {
    // Calculate initial priority based on due date and points
    const priority = this.calculateAssignmentPriority(assignment);

    const query = `
      INSERT INTO assignments (
        id,
        user_id,
        course_id,
        canvas_id,
        title,
        description,
        due_date,
        lock_date,
        unlock_date,
        points_possible,
        submission_types,
        workflow_state,
        priority,
        last_synced
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
      )
      ON CONFLICT (canvas_id) 
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        due_date = EXCLUDED.due_date,
        lock_date = EXCLUDED.lock_date,
        unlock_date = EXCLUDED.unlock_date,
        points_possible = EXCLUDED.points_possible,
        submission_types = EXCLUDED.submission_types,
        workflow_state = EXCLUDED.workflow_state,
        priority = EXCLUDED.priority,
        last_synced = NOW()
      RETURNING id
    `;

    await Database.query(query, [
      userId,
      courseId,
      assignment.id.toString(),
      assignment.name,
      assignment.description || '',
      assignment.due_at ? new Date(assignment.due_at) : null,
      assignment.lock_at ? new Date(assignment.lock_at) : null,
      assignment.unlock_at ? new Date(assignment.unlock_at) : null,
      assignment.points_possible || 0,
      assignment.submission_types || [],
      assignment.workflow_state,
      priority
    ]);
  }

  /**
   * Calculate assignment priority based on multiple factors
   */
  private calculateAssignmentPriority(assignment: CanvasAssignment): 'high' | 'medium' | 'low' {
    const now = new Date();
    const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
    
    if (!dueDate) {
      return 'low';
    }

    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const points = assignment.points_possible || 0;

    // High priority: Due within 24 hours OR worth >= 100 points
    if (hoursUntilDue <= 24 || points >= 100) {
      return 'high';
    }

    // Medium priority: Due within 72 hours OR worth >= 50 points
    if (hoursUntilDue <= 72 || points >= 50) {
      return 'medium';
    }

    // Low priority: Everything else
    return 'low';
  }

  /**
   * Upsert submission in database
   */
  private async upsertSubmission(userId: string, canvasAssignmentId: string, submission: CanvasSubmission): Promise<void> {
    // Get assignment ID from our database
    const assignmentResult = await Database.query(
      'SELECT id FROM assignments WHERE canvas_id = $1',
      [canvasAssignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return;
    }

    const assignmentId = assignmentResult.rows[0].id;

    const query = `
      INSERT INTO assignment_submissions (
        id,
        assignment_id,
        user_id,
        canvas_submission_id,
        submitted_at,
        score,
        grade,
        workflow_state,
        late,
        missing
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      ON CONFLICT (canvas_submission_id) 
      DO UPDATE SET
        submitted_at = EXCLUDED.submitted_at,
        score = EXCLUDED.score,
        grade = EXCLUDED.grade,
        workflow_state = EXCLUDED.workflow_state,
        late = EXCLUDED.late,
        missing = EXCLUDED.missing
    `;

    await Database.query(query, [
      assignmentId,
      userId,
      submission.id.toString(),
      submission.submitted_at ? new Date(submission.submitted_at) : null,
      submission.score,
      submission.grade,
      submission.workflow_state,
      submission.late || false,
      submission.missing || false
    ]);
  }

  /**
   * Update last synced timestamp
   */
  private async updateLastSyncedAt(userId: string): Promise<void> {
    await Database.query(
      'UPDATE canvas_connections SET last_synced_at = NOW() WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Get sync status for a user
   */
  async getSyncStatus(userId: string): Promise<CanvasSyncStatus> {
    try {
      const connectionStatus = await canvasAuthService.getConnectionStatus(userId);
      
      if (!connectionStatus.isConnected) {
        return {
          userId,
          lastSyncedAt: new Date(),
          isConnected: false,
          totalCourses: 0,
          totalAssignments: 0
        };
      }

      // Get counts from database
      const courseCountResult = await Database.query(
        'SELECT COUNT(*) as count FROM courses WHERE user_id = $1',
        [userId]
      );

      const assignmentCountResult = await Database.query(
        'SELECT COUNT(*) as count FROM assignments WHERE user_id = $1',
        [userId]
      );

      return {
        userId,
        lastSyncedAt: connectionStatus.lastSyncedAt || new Date(),
        isConnected: true,
        totalCourses: parseInt(courseCountResult.rows[0].count),
        totalAssignments: parseInt(assignmentCountResult.rows[0].count)
      };
    } catch (error) {
      logger.error('Failed to get sync status:', error);
      throw error;
    }
  }
}

export const canvasSyncService = new CanvasSyncService();