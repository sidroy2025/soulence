// Academic Service Types

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

export interface Course {
  id: string;
  canvasId: string;
  name: string;
  courseCode?: string;
  term?: string;
  teachers?: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  currentGrade?: number;
  workflowState: string;
  startDate?: Date;
  endDate?: Date;
}

export interface Assignment {
  id: string;
  canvasId: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  pointsPossible?: number;
  priority: 'low' | 'medium' | 'high';
  workflowState: string;
}

export interface CanvasConnection {
  isConnected: boolean;
  canvasUserName?: string;
  canvasUserEmail?: string;
  connectedAt?: Date;
  lastSyncedAt?: Date;
}

export interface TaskStatistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  completionRate: number;
}

export interface StressLevel {
  level: 'low' | 'medium' | 'high';
  score: number;
  lastCalculated: Date;
  indicators: Array<{
    type: string;
    value: number;
    weight: number;
  }>;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  courseId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  isFromCanvas?: boolean;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  estimatedMinutes?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed';
  estimatedMinutes?: number;
}