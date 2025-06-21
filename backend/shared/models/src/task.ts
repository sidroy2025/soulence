import { v4 as uuidv4 } from 'uuid';

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedDuration?: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags?: string[];
}

export interface StudyRoutine {
  id: string;
  userId: string;
  routineData: {
    schedule: {
      dayOfWeek: number; // 0-6
      startTime: string; // HH:MM
      endTime: string;
      subject?: string;
      taskType?: string;
    }[];
    breakDuration: number; // minutes
    sessionDuration: number; // minutes
    reminders: boolean;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressLog {
  id: string;
  userId: string;
  taskId: string;
  timeSpent: number; // minutes
  completionPercentage: number;
  notes?: string;
  loggedAt: Date;
}

export class TaskModel {
  static create(
    userId: string,
    title: string,
    priority: TaskPriority = TaskPriority.MEDIUM
  ): Task {
    return {
      id: uuidv4(),
      userId,
      title,
      priority,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static checkOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === TaskStatus.COMPLETED) return false;
    return new Date() > new Date(task.dueDate);
  }
}