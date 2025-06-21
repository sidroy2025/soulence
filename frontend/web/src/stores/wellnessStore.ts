import { create } from 'zustand';
import { MoodLog, MoodStats, LogMoodRequest, CrisisResources } from '@/types/wellness';
import { wellnessService } from '@/services/wellnessService';

interface WellnessState {
  // State
  moodLogs: MoodLog[];
  todayMood: MoodLog | null;
  hasMoodToday: boolean;
  moodStats: MoodStats | null;
  crisisResources: CrisisResources | null;
  insights: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  logMood: (data: LogMoodRequest) => Promise<void>;
  loadMoodHistory: () => Promise<void>;
  loadTodayMood: () => Promise<void>;
  loadMoodTrends: (period?: string) => Promise<void>;
  loadCrisisResources: () => Promise<void>;
  updateMoodLog: (moodId: string, data: Partial<LogMoodRequest>) => Promise<void>;
  deleteMoodLog: (moodId: string) => Promise<void>;
  clearError: () => void;
}

export const useWellnessStore = create<WellnessState>((set, get) => ({
  // Initial state
  moodLogs: [],
  todayMood: null,
  hasMoodToday: false,
  moodStats: null,
  crisisResources: null,
  insights: [],
  isLoading: false,
  error: null,

  logMood: async (data: LogMoodRequest) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await wellnessService.logMood(data);
      const newMoodLog = response.moodLog;
      
      // Update state
      set(state => ({
        moodLogs: [newMoodLog, ...state.moodLogs],
        todayMood: newMoodLog,
        hasMoodToday: true,
        isLoading: false
      }));
      
      // Reload stats to get updated calculations
      await get().loadMoodHistory();
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to log mood';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  loadMoodHistory: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const data = await wellnessService.getMoodHistory({ limit: 30 });
      
      set({
        moodLogs: data.moodLogs,
        moodStats: data.stats,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load mood history';
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadTodayMood: async () => {
    try {
      const data = await wellnessService.getTodayMood();
      
      set({
        hasMoodToday: data.hasMoodToday,
        todayMood: data.mood || null
      });
    } catch (error: any) {
      console.error('Failed to load today\'s mood:', error);
    }
  },

  loadMoodTrends: async (period = '7d') => {
    set({ isLoading: true });
    
    try {
      const data = await wellnessService.getMoodTrends(period);
      
      set({
        insights: data.insights,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to load mood trends';
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadCrisisResources: async () => {
    try {
      const resources = await wellnessService.getCrisisResources();
      set({ crisisResources: resources });
    } catch (error: any) {
      console.error('Failed to load crisis resources:', error);
    }
  },

  updateMoodLog: async (moodId: string, data: Partial<LogMoodRequest>) => {
    set({ isLoading: true, error: null });
    
    try {
      const updatedMood = await wellnessService.updateMoodLog(moodId, data);
      
      set(state => ({
        moodLogs: state.moodLogs.map(log => 
          log.id === moodId ? updatedMood : log
        ),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update mood';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  deleteMoodLog: async (moodId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await wellnessService.deleteMoodLog(moodId);
      
      set(state => ({
        moodLogs: state.moodLogs.filter(log => log.id !== moodId),
        isLoading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete mood';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));