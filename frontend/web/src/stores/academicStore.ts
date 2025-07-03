import { create } from 'zustand';
import { academicService } from '../services/academicService';
import type {
  Task,
  CanvasConnection,
  TaskStatistics,
  StressLevel,
  TaskFilters,
  CreateTaskRequest,
  UpdateTaskRequest
} from '../types/academic';

interface AcademicState {
  // Canvas Connection
  canvasConnection: CanvasConnection | null;
  isConnecting: boolean;
  
  // Tasks
  tasks: Task[];
  upcomingTasks: Task[];
  taskStatistics: TaskStatistics | null;
  isLoadingTasks: boolean;
  
  // Stress Level
  stressLevel: StressLevel | null;
  isLoadingStress: boolean;
  
  // General loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCanvasStatus: () => Promise<void>;
  connectCanvas: () => Promise<string>;
  disconnectCanvas: () => Promise<void>;
  syncCanvasData: () => Promise<void>;
  
  fetchTasks: (filters?: TaskFilters) => Promise<void>;
  createTask: (taskData: CreateTaskRequest) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  fetchUpcomingTasks: (days?: number) => Promise<void>;
  fetchTaskStatistics: () => Promise<void>;
  
  fetchStressLevel: () => Promise<void>;
  
  clearError: () => void;
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  // Initial state
  canvasConnection: null,
  isConnecting: false,
  tasks: [],
  upcomingTasks: [],
  taskStatistics: null,
  isLoadingTasks: false,
  stressLevel: null,
  isLoadingStress: false,
  isLoading: false,
  error: null,

  // Canvas Actions
  fetchCanvasStatus: async () => {
    try {
      set({ isLoading: true, error: null });
      const connection = await academicService.getCanvasConnectionStatus();
      set({ canvasConnection: connection });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch Canvas status' });
    } finally {
      set({ isLoading: false });
    }
  },

  connectCanvas: async () => {
    try {
      set({ isConnecting: true, error: null });
      const { authUrl } = await academicService.initiateCanvasOAuth();
      
      // Open Canvas OAuth in new window
      window.open(authUrl, 'canvas-oauth', 'width=600,height=700');
      
      return authUrl;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to connect Canvas' });
      throw error;
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnectCanvas: async () => {
    try {
      set({ isLoading: true, error: null });
      await academicService.disconnectCanvas();
      set({ 
        canvasConnection: { isConnected: false },
        tasks: [],
        upcomingTasks: [],
        taskStatistics: null
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to disconnect Canvas' });
    } finally {
      set({ isLoading: false });
    }
  },

  syncCanvasData: async () => {
    try {
      set({ isLoading: true, error: null });
      await academicService.syncCanvasData();
      
      // Refresh data after sync
      await Promise.all([
        get().fetchTasks(),
        get().fetchTaskStatistics(),
        get().fetchStressLevel()
      ]);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sync Canvas data' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Task Actions
  fetchTasks: async (filters?: TaskFilters) => {
    try {
      set({ isLoadingTasks: true, error: null });
      const tasks = await academicService.getTasks(filters);
      set({ tasks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch tasks' });
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  createTask: async (taskData: CreateTaskRequest) => {
    try {
      set({ isLoading: true, error: null });
      const newTask = await academicService.createTask(taskData);
      
      const currentTasks = get().tasks;
      set({ tasks: [newTask, ...currentTasks] });
      
      // Refresh statistics
      await get().fetchTaskStatistics();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create task' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateTask: async (taskId: string, updates: UpdateTaskRequest) => {
    try {
      set({ isLoading: true, error: null });
      const updatedTask = await academicService.updateTask(taskId, updates);
      
      const currentTasks = get().tasks;
      const updatedTasks = currentTasks.map(task => 
        task.id === taskId ? updatedTask : task
      );
      set({ tasks: updatedTasks });
      
      // Refresh statistics
      await get().fetchTaskStatistics();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update task' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      set({ isLoading: true, error: null });
      await academicService.deleteTask(taskId);
      
      const currentTasks = get().tasks;
      const filteredTasks = currentTasks.filter(task => task.id !== taskId);
      set({ tasks: filteredTasks });
      
      // Refresh statistics
      await get().fetchTaskStatistics();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete task' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUpcomingTasks: async (days = 7) => {
    try {
      set({ isLoadingTasks: true, error: null });
      const upcomingTasks = await academicService.getUpcomingTasks(days);
      set({ upcomingTasks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch upcoming tasks' });
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  fetchTaskStatistics: async () => {
    try {
      const statistics = await academicService.getTaskStatistics();
      set({ taskStatistics: statistics });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch task statistics' });
    }
  },

  // Stress Level Actions
  fetchStressLevel: async () => {
    try {
      set({ isLoadingStress: true, error: null });
      const stressLevel = await academicService.getStressLevel();
      set({ stressLevel });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch stress level' });
    } finally {
      set({ isLoadingStress: false });
    }
  },

  clearError: () => set({ error: null })
}));