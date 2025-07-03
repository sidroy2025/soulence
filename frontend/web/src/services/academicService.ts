import { mockApiService } from './mockApi';
import type {
  Task,
  CanvasConnection,
  TaskStatistics,
  StressLevel,
  TaskFilters,
  CreateTaskRequest,
  UpdateTaskRequest
} from '../types/academic';

export class AcademicService {

  // Canvas Integration
  async getCanvasConnectionStatus(): Promise<CanvasConnection> {
    return mockApiService.getCanvasConnectionStatus();
  }

  async initiateCanvasOAuth(): Promise<{ authUrl: string; state: string }> {
    return mockApiService.initiateCanvasOAuth();
  }

  async disconnectCanvas(): Promise<void> {
    return mockApiService.disconnectCanvas();
  }

  async syncCanvasData(): Promise<void> {
    return mockApiService.syncCanvasData();
  }

  // Task Management
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
    return mockApiService.getTasks(filters);
  }

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    return mockApiService.createTask(taskData);
  }

  async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
    return mockApiService.updateTask(taskId, updates);
  }

  async deleteTask(taskId: string): Promise<void> {
    return mockApiService.deleteTask(taskId);
  }

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    return mockApiService.getUpcomingTasks(days);
  }

  async getTaskStatistics(): Promise<TaskStatistics> {
    return mockApiService.getTaskStatistics();
  }

  // Analytics
  async getStressLevel(): Promise<StressLevel> {
    return mockApiService.getStressLevel();
  }

  async getStressTrends(days: number = 30): Promise<Array<{
    date: Date;
    level: string;
    score: number;
  }>> {
    // Mock implementation for stress trends
    const trends = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const score = Math.random() * 10;
      let level = 'low';
      if (score >= 8) level = 'high';
      else if (score >= 4) level = 'medium';
      
      trends.push({ date, level, score });
    }
    return trends;
  }
}

export const academicService = new AcademicService();