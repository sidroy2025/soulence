// Sleep Store
// Zustand store for sleep data management

import { create } from 'zustand';
import { SleepSession, CreateSleepSessionRequest, SleepAnalytics, SleepInsight, SleepStore } from '../types/sleep';
import { sleepService } from '../services/sleepService';

export const useSleepStore = create<SleepStore>((set, get) => ({
  // State
  sessions: [],
  todaysSession: null,
  analytics: null,
  insights: [],
  patterns: [],
  correlations: [],
  loading: false,
  error: null,

  // Actions
  fetchTodaysSession: async () => {
    try {
      set({ loading: true, error: null });
      const session = await sleepService.getTodaysSession();
      set({ todaysSession: session, loading: false });
    } catch (error) {
      console.error('Failed to fetch today\'s sleep session:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch today\'s sleep session', 
        loading: false 
      });
    }
  },

  fetchSessions: async (params = {}) => {
    try {
      set({ loading: true, error: null });
      console.log('🔄 Store: Fetching sessions with params:', params);
      const { sessions } = await sleepService.getSessions(params);
      console.log(`📊 Store: Received ${sessions.length} sessions from service`);
      console.log('📋 Store: Session dates:', sessions.map(s => `${s.sessionDate} (${s.notes?.substring(0, 20) || 'manual'})`));
      set({ sessions, loading: false });
    } catch (error) {
      console.error('Failed to fetch sleep sessions:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sleep sessions', 
        loading: false 
      });
    }
  },

  fetchAnalytics: async (period = '30d') => {
    try {
      set({ loading: true, error: null });
      const analytics = await sleepService.getAnalytics(period);
      set({ analytics, loading: false });
    } catch (error) {
      console.error('Failed to fetch sleep analytics:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sleep analytics', 
        loading: false 
      });
    }
  },

  fetchInsights: async () => {
    try {
      set({ loading: true, error: null });
      const insights = await sleepService.getInsights();
      set({ insights, loading: false });
    } catch (error) {
      console.error('Failed to fetch sleep insights:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch sleep insights', 
        loading: false 
      });
    }
  },

  createSession: async (sessionData: CreateSleepSessionRequest) => {
    try {
      set({ loading: true, error: null });
      const newSession = await sleepService.createSession(sessionData);
      
      // Update sessions list
      const currentSessions = get().sessions;
      const updatedSessions = [newSession, ...currentSessions.filter(s => s.id !== newSession.id)];
      
      // If this is today's session, update todaysSession
      const today = new Date().toISOString().split('T')[0];
      const todaysSession = newSession.sessionDate === today ? newSession : get().todaysSession;
      
      set({ 
        sessions: updatedSessions,
        todaysSession,
        loading: false 
      });
      
      // Refresh analytics after creating a session
      get().fetchAnalytics();
    } catch (error) {
      console.error('Failed to create sleep session:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create sleep session', 
        loading: false 
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  updateSession: async (id: string, sessionData: Partial<CreateSleepSessionRequest>) => {
    try {
      set({ loading: true, error: null });
      const updatedSession = await sleepService.updateSession(id, sessionData);
      
      // Update sessions list
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.map(session => 
        session.id === id ? updatedSession : session
      );
      
      // If this is today's session, update todaysSession
      const today = new Date().toISOString().split('T')[0];
      const todaysSession = updatedSession.sessionDate === today ? updatedSession : get().todaysSession;
      
      set({ 
        sessions: updatedSessions,
        todaysSession,
        loading: false 
      });
      
      // Refresh analytics after updating a session
      get().fetchAnalytics();
    } catch (error) {
      console.error('Failed to update sleep session:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update sleep session', 
        loading: false 
      });
      throw error;
    }
  },

  deleteSession: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await sleepService.deleteSession(id);
      
      // Remove from sessions list
      const currentSessions = get().sessions;
      const updatedSessions = currentSessions.filter(session => session.id !== id);
      
      // If this was today's session, clear todaysSession
      const todaysSession = get().todaysSession;
      const newTodaysSession = todaysSession?.id === id ? null : todaysSession;
      
      set({ 
        sessions: updatedSessions,
        todaysSession: newTodaysSession,
        loading: false 
      });
      
      // Refresh analytics after deleting a session
      get().fetchAnalytics();
    } catch (error) {
      console.error('Failed to delete sleep session:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete sleep session', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));