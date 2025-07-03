import api from './api';
import { 
  MoodLog, 
  MoodResponse, 
  LogMoodRequest, 
  CrisisResources,
  CrisisAlert 
} from '@/types/wellness';
import { mockApiService } from './mockApi';

// Use mock API for demo (set to false when backend is available)
const USE_MOCK_API = true;

export const wellnessService = {
  // Log a new mood entry
  async logMood(data: LogMoodRequest): Promise<{ moodLog: MoodLog }> {
    if (USE_MOCK_API) {
      return await mockApiService.logMood(data);
    }
    const response = await api.post('/mood', data);
    return response.data.data;
  },

  // Get mood history
  async getMoodHistory(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<MoodResponse['data']> {
    if (USE_MOCK_API) {
      return await mockApiService.getMoodHistory();
    }
    const response = await api.get<MoodResponse>('/mood/history', { params });
    return response.data.data;
  },

  // Get today's mood
  async getTodayMood(): Promise<{ hasMoodToday: boolean; mood?: MoodLog }> {
    if (USE_MOCK_API) {
      return await mockApiService.getTodayMood();
    }
    const response = await api.get('/mood/today');
    return response.data.data;
  },

  // Get mood trends
  async getMoodTrends(period = '7d'): Promise<{
    trends: any;
    insights: string[];
  }> {
    const response = await api.get('/mood/trends', { 
      params: { period } 
    });
    return response.data.data;
  },

  // Update a mood log
  async updateMoodLog(moodId: string, data: Partial<LogMoodRequest>): Promise<MoodLog> {
    const response = await api.put(`/mood/${moodId}`, data);
    return response.data.data.moodLog;
  },

  // Delete a mood log
  async deleteMoodLog(moodId: string): Promise<void> {
    await api.delete(`/mood/${moodId}`);
  },

  // Get crisis resources
  async getCrisisResources(): Promise<CrisisResources> {
    if (USE_MOCK_API) {
      return await mockApiService.getCrisisResources();
    }
    const response = await api.get('/crisis/resources');
    return response.data.data;
  },

  // Get crisis history
  async getCrisisHistory(limit = 10): Promise<{ alerts: CrisisAlert[]; count: number }> {
    const response = await api.get('/crisis/history', { 
      params: { limit } 
    });
    return response.data.data;
  },

  // Report a crisis manually
  async reportCrisis(data: { 
    severityLevel: number; 
    description: string; 
  }): Promise<void> {
    await api.post('/crisis/report', data);
  }
};