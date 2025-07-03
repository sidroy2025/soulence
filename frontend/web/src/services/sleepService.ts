// Sleep Service API Client
// Handles communication with Sleep Service backend

import { SleepSession, CreateSleepSessionRequest, SleepAnalytics, SleepInsight, SleepApiResponse } from '../types/sleep';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3006/api/v1/sleep'
  : '/api/v1/sleep';

// Set to true to use mock data (when backend is not running)
const USE_MOCK_DATA = false; // TODO: Set to false when backend is running

class SleepService {
  private mockData = {
    sessions: [
      {
        id: 'sleep_1',
        userId: 'demo-user-id',
        sessionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 23.5 * 60 * 60 * 1000).toISOString(),
        wakeTime: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(),
        totalSleepDuration: 450, // 7.5 hours
        sleepEfficiency: 85,
        qualityScore: 7,
        energyLevel: 8,
        moodUponWaking: 'refreshed',
        stressLevelBeforeBed: 4,
        caffeineAfter2pm: false,
        alcoholConsumed: false,
        exerciseDay: true,
        screenTimeBeforeBed: 30,
        roomTemperature: 'comfortable' as const,
        notes: 'Good sleep after exercising',
        dataSource: 'manual' as const,
        confidenceScore: 1.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sleep_2',
        userId: 'demo-user-id',
        sessionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        bedtime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000).toISOString(),
        wakeTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 6.5 * 60 * 60 * 1000).toISOString(),
        totalSleepDuration: 390, // 6.5 hours
        sleepEfficiency: 78,
        qualityScore: 5,
        energyLevel: 6,
        moodUponWaking: 'groggy',
        stressLevelBeforeBed: 7,
        caffeineAfter2pm: true,
        alcoholConsumed: false,
        exerciseDay: false,
        screenTimeBeforeBed: 120,
        roomTemperature: 'warm' as const,
        notes: 'Had trouble falling asleep',
        dataSource: 'manual' as const,
        confidenceScore: 1.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    insights: [
      {
        id: 'insight_1',
        type: 'pattern_discovery' as const,
        category: 'timing' as const,
        title: 'Consistent Bedtime Opportunity',
        description: 'Your bedtime varies by over 2 hours. A more consistent schedule could improve your sleep quality.',
        actionable: true,
        recommendations: [
          'Set a target bedtime and stick to it within 30 minutes',
          'Use a bedtime reminder 1 hour before your target time'
        ],
        difficulty: 'moderate' as const,
        expectedImpact: 'high' as const,
        priority: 'high' as const
      },
      {
        id: 'insight_2',
        type: 'correlation_insight' as const,
        category: 'quality' as const,
        title: 'Screen Time Impact',
        description: 'You sleep better on nights when you have less than 1 hour of screen time before bed.',
        actionable: true,
        recommendations: [
          'Try to stop using screens 1-2 hours before bedtime',
          'Use blue light filters after sunset'
        ],
        difficulty: 'moderate' as const,
        expectedImpact: 'moderate' as const,
        priority: 'medium' as const
      }
    ]
  };

  constructor() {
    console.log('🏗️ SleepService initialized with', this.mockData.sessions.length, 'mock sessions');
    console.log('📋 Initial sessions:', this.mockData.sessions.map(s => `${s.sessionDate} - ${s.notes}`));
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<SleepApiResponse<T>> {
    console.log(`🔗 Service request: ${endpoint}`, options);
    
    // If USE_MOCK_DATA is true, skip trying the real API
    if (USE_MOCK_DATA) {
      console.log('📦 Using mock data (USE_MOCK_DATA=true)');
      return this.getMockResponse(endpoint, options);
    }
    
    // Try real API first, fall back to mock data
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer demo-token`, // Demo token for development
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      console.log(`✅ API response for ${endpoint}:`, data);
      return data;
    } catch (error: any) {
      console.warn(`Sleep API not available, using mock data for ${endpoint}`, error.message);
      return this.getMockResponse(endpoint, options);
    }
  }

  private async getMockResponse<T>(endpoint: string, options: RequestInit = {}): Promise<SleepApiResponse<T>> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const method = options.method || 'GET';
    console.log(`🎭 Mock response for ${method} ${endpoint}`);
    
    if (endpoint === '/sessions/today' && method === 'GET') {
      const today = new Date().toISOString().split('T')[0];
      const todaysSession = this.mockData.sessions.find(s => s.sessionDate === today);
      return { success: true, data: todaysSession as any };
    }
    
    if ((endpoint === '/sessions' || endpoint.startsWith('/sessions?')) && method === 'GET') {
      console.log(`🔍 Service: Returning ${this.mockData.sessions.length} sessions from mock data`);
      console.log('📊 Service: Session IDs:', this.mockData.sessions.map(s => `${s.id} (${s.sessionDate})`));
      return { 
        success: true, 
        data: this.mockData.sessions as any,
        pagination: { page: 1, limit: 20, total: this.mockData.sessions.length, totalPages: 1 }
      } as any;
    }
    
    if (endpoint === '/sessions' && method === 'POST') {
      const sessionData = JSON.parse(options.body as string);
      const newSession = {
        id: `sleep_${Date.now()}`,
        userId: 'demo-user-id',
        sessionDate: sessionData.sessionDate,
        bedtime: sessionData.bedtime,
        wakeTime: sessionData.wakeTime,
        totalSleepDuration: sessionData.totalSleepDuration || 420,
        sleepEfficiency: sessionData.sleepEfficiency || 85,
        qualityScore: sessionData.qualityScore || 7,
        energyLevel: sessionData.energyLevel || 7,
        moodUponWaking: sessionData.moodUponWaking || 'refreshed',
        stressLevelBeforeBed: sessionData.stressLevelBeforeBed || 3,
        caffeineAfter2pm: sessionData.caffeineAfter2pm || false,
        alcoholConsumed: sessionData.alcoholConsumed || false,
        exerciseDay: sessionData.exerciseDay || false,
        screenTimeBeforeBed: sessionData.screenTimeBeforeBed || 30,
        roomTemperature: sessionData.roomTemperature || 'comfortable',
        notes: sessionData.notes || '',
        dataSource: 'manual' as const,
        confidenceScore: 1.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add to beginning of array so it shows up in history
      this.mockData.sessions.unshift(newSession);
      console.log('✅ Added new sleep session:', newSession);
      console.log('📊 Total sessions now:', this.mockData.sessions.length);
      
      return { success: true, data: newSession as any };
    }
    
    if (endpoint.startsWith('/analytics')) {
      const analytics = {
        userId: 'demo-user-id',
        period: '7d',
        averageSleepDuration: 420, // 7 hours
        averageQualityScore: 6.8,
        averageEfficiency: 82,
        averageEnergyLevel: 7.2,
        averageBedtime: '23:30',
        averageWakeTime: '07:00',
        qualityTrend: 'stable' as const,
        durationTrend: 'stable' as const,
        sleepGoals: {
          targetDuration: 480, // 8 hours
          targetBedtime: '23:00',
          targetWakeTime: '07:00',
          targetQuality: 8
        },
        goalsMetPercentage: {
          duration: 65,
          bedtime: 40,
          quality: 70
        }
      };
      return { success: true, data: analytics as any };
    }
    
    if (endpoint === '/insights') {
      return { success: true, data: this.mockData.insights as any };
    }
    
    if (endpoint === '/correlations') {
      const correlations = [
        {
          type: 'mood',
          correlation: 0.65,
          strength: 'moderate',
          significance: 0.02,
          description: 'Better sleep quality correlates with improved mood'
        },
        {
          type: 'academic_stress',
          correlation: -0.45,
          strength: 'moderate',
          significance: 0.04,
          description: 'Higher academic stress correlates with poorer sleep quality'
        }
      ];
      return { success: true, data: correlations as any };
    }
    
    if (endpoint === '/interventions') {
      return { success: true, data: [] as any };
    }
    
    return { success: true, data: null as any };
  }

  // Sleep session endpoints
  async getTodaysSession(): Promise<SleepSession | null> {
    const response = await this.request<SleepSession>('/sessions/today');
    return response.data || null;
  }

  async getSessions(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sessions: SleepSession[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());

    const endpoint = `/sessions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<SleepSession[]>(endpoint);
    
    return {
      sessions: response.data || [],
      pagination: (response as any).pagination || {}
    };
  }

  async getSessionById(id: string): Promise<SleepSession | null> {
    const response = await this.request<SleepSession>(`/sessions/${id}`);
    return response.data || null;
  }

  async getSessionByDate(date: string): Promise<SleepSession | null> {
    const response = await this.request<SleepSession>(`/sessions/date/${date}`);
    return response.data || null;
  }

  async createSession(sessionData: CreateSleepSessionRequest): Promise<SleepSession> {
    const response = await this.request<SleepSession>('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });

    if (!response.data) {
      throw new Error('Failed to create sleep session');
    }

    return response.data;
  }

  async updateSession(id: string, sessionData: Partial<CreateSleepSessionRequest>): Promise<SleepSession> {
    const response = await this.request<SleepSession>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    });

    if (!response.data) {
      throw new Error('Failed to update sleep session');
    }

    return response.data;
  }

  async deleteSession(id: string): Promise<void> {
    await this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async getRecentSummary(days: number = 7): Promise<any> {
    const response = await this.request(`/sessions/summary?days=${days}`);
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(period: string = '30d'): Promise<SleepAnalytics> {
    const response = await this.request<SleepAnalytics>(`/analytics?period=${period}`);
    return response.data || {} as SleepAnalytics;
  }

  async getTrends(): Promise<any> {
    const response = await this.request('/analytics/trends');
    return response.data;
  }

  // Insights endpoints
  async getInsights(): Promise<SleepInsight[]> {
    const response = await this.request<SleepInsight[]>('/insights');
    return response.data || [];
  }

  async markInsightViewed(id: string): Promise<void> {
    await this.request(`/insights/${id}/viewed`, {
      method: 'PUT',
    });
  }

  async rateInsight(id: string, rating: number): Promise<void> {
    await this.request(`/insights/${id}/rate`, {
      method: 'PUT',
      body: JSON.stringify({ rating }),
    });
  }

  async dismissInsight(id: string): Promise<void> {
    await this.request(`/insights/${id}/dismiss`, {
      method: 'PUT',
    });
  }

  // Correlations endpoints
  async getCorrelations(): Promise<any[]> {
    const response = await this.request<any[]>('/correlations');
    return response.data || [];
  }

  async getCorrelationDetails(type: string): Promise<any> {
    const response = await this.request(`/correlations/${type}`);
    return response.data;
  }

  // Interventions endpoints
  async getInterventions(): Promise<any[]> {
    const response = await this.request<any[]>('/interventions');
    return response.data || [];
  }

  async acknowledgeIntervention(id: string): Promise<void> {
    await this.request(`/interventions/${id}/acknowledge`, {
      method: 'PUT',
    });
  }

  async completeIntervention(id: string, rating?: number, feedback?: string): Promise<void> {
    await this.request(`/interventions/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ rating, feedback }),
    });
  }

  // Device Integration Methods
  async syncFromGoogleFit(startDate?: Date, endDate?: Date): Promise<SleepSession[]> {
    try {
      const { googleFitService } = await import('./googleFitService');
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const end = endDate || new Date();
      
      console.log('🔄 Starting Google Fit sync...');
      const sessions = await googleFitService.getSleepData(start, end);
      console.log(`📥 Fetched ${sessions.length} sessions from Google Fit`);
      
      if (sessions.length === 0) {
        console.log('⚠️ No sleep sessions to sync');
        return [];
      }
      
      const syncedSessions: SleepSession[] = [];
      let syncErrors = 0;
      
      // Sync sessions to backend/mock storage
      for (const session of sessions) {
        try {
          console.log(`💾 Syncing session: ${session.sessionDate} (${Math.round((session.totalSleepDuration || 0) / 60)}h)`);
          
          // Check if session already exists to avoid duplicates
          const existingSession = this.mockData.sessions.find(s => 
            s.sessionDate === session.sessionDate && 
            (s.dataSource?.includes('google') || s.notes?.includes('Google Fit'))
          );
          
          if (existingSession) {
            console.log(`⏩ Skipping existing session: ${session.sessionDate}`);
            continue;
          }
          
          // Convert Google Fit session to Soulence format
          const soulenceSession = {
            sessionDate: session.sessionDate,
            bedtime: session.bedtime,
            wakeTime: session.wakeTime,
            totalSleepDuration: session.totalSleepDuration || 0,
            sleepEfficiency: session.sleepEfficiency || 85,
            qualityScore: session.qualityScore || 7,
            energyLevel: session.qualityScore || 7,
            moodUponWaking: (session.qualityScore || 0) >= 7 ? 'refreshed' : 'groggy',
            stressLevelBeforeBed: 3,
            caffeineAfter2pm: false,
            alcoholConsumed: false,
            exerciseDay: false,
            screenTimeBeforeBed: 30,
            roomTemperature: 'comfortable' as const,
            notes: `Auto-synced from Google Fit (${session.dataSource}) - Duration: ${Math.round((session.totalSleepDuration || 0) / 60)}h ${(session.totalSleepDuration || 0) % 60}m`,
            dataSource: session.dataSource || 'wearable',
            confidenceScore: session.confidenceScore || 0.8
          };
          
          console.log('🔍 Converting Google Fit session:', {
            from: session,
            to: soulenceSession
          });
          
          const savedSession = await this.createSession(soulenceSession);
          syncedSessions.push(savedSession);
          console.log(`✅ Successfully synced session: ${savedSession.id}`);
          
        } catch (error: any) {
          syncErrors++;
          console.warn('❌ Failed to sync session:', session.sessionDate, error);
        }
      }
      
      console.log(`🎯 Sync complete: ${syncedSessions.length} synced, ${syncErrors} errors`);
      console.log(`📊 Total sessions in mock storage: ${this.mockData.sessions.length}`);
      
      // Log first few sessions for debugging
      if (this.mockData.sessions.length > 0) {
        console.log('📋 Current sessions in storage:');
        this.mockData.sessions.slice(0, 5).forEach((session, index) => {
          console.log(`  ${index + 1}. ${session.sessionDate} - ${session.notes || 'Manual entry'}`);
        });
      }
      
      return syncedSessions;
    } catch (error: any) {
      console.error('❌ Google Fit sync failed:', error);
      throw error;
    }
  }

  async syncFromSamsungHealth(startDate?: Date, endDate?: Date): Promise<SleepSession[]> {
    try {
      const { samsungHealthService } = await import('./samsungHealthService');
      const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();
      
      const sessions = await samsungHealthService.getSleepData(start, end);
      
      // Sync sessions to backend
      for (const session of sessions) {
        try {
          await this.createSession(session);
        } catch (error) {
          console.warn('Failed to sync session:', session.id, error);
        }
      }
      
      return sessions;
    } catch (error: any) {
      console.warn('Samsung Health sync not available:', error.message);
      return [];
    }
  }

  async getConnectedDevices(): Promise<Array<{
    type: 'google_fit' | 'samsung_health' | 'fitbit' | 'apple_health';
    name: string;
    isConnected: boolean;
    lastSync?: Date;
  }>> {
    const devices = [];
    
    try {
      const { googleFitService } = await import('./googleFitService');
      const googleFitStatus = await googleFitService.testConnection();
      devices.push({
        type: 'google_fit' as const,
        name: 'Google Fit',
        isConnected: googleFitStatus.hasData,
        lastSync: googleFitStatus.lastSync
      });
    } catch (error: any) {
      console.warn('Google Fit not available:', error.message);
      devices.push({
        type: 'google_fit' as const,
        name: 'Google Fit',
        isConnected: false
      });
    }

    try {
      const { samsungHealthService } = await import('./samsungHealthService');
      const isConnected = await samsungHealthService.isConnected();
      devices.push({
        type: 'samsung_health' as const,
        name: 'Samsung Health',
        isConnected
      });
    } catch (error: any) {
      console.warn('Samsung Health not available:', error.message);
      devices.push({
        type: 'samsung_health' as const,
        name: 'Samsung Health',
        isConnected: false
      });
    }

    return devices;
  }

  async connectDevice(deviceType: 'google_fit' | 'samsung_health'): Promise<boolean> {
    try {
      switch (deviceType) {
        case 'google_fit':
          const { googleFitService } = await import('./googleFitService');
          return await googleFitService.authenticateUser();
          
        case 'samsung_health':
          const { samsungHealthService } = await import('./samsungHealthService');
          return await samsungHealthService.authenticate();
          
        default:
          throw new Error(`Unsupported device type: ${deviceType}`);
      }
    } catch (error: any) {
      console.error(`Failed to connect ${deviceType}:`, error);
      return false;
    }
  }

  async disconnectDevice(deviceType: 'google_fit' | 'samsung_health'): Promise<void> {
    try {
      switch (deviceType) {
        case 'google_fit':
          const { googleFitService } = await import('./googleFitService');
          await googleFitService.disconnect();
          break;
          
        case 'samsung_health':
          const { samsungHealthService } = await import('./samsungHealthService');
          await samsungHealthService.disconnect();
          break;
      }
    } catch (error: any) {
      console.error(`Failed to disconnect ${deviceType}:`, error);
      throw error;
    }
  }

  // Utility methods
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  calculateSleepDuration(bedtime: string, wakeTime: string): number {
    const bed = new Date(bedtime);
    const wake = new Date(wakeTime);
    return Math.round((wake.getTime() - bed.getTime()) / (1000 * 60));
  }

  getQualityCategory(score: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (score <= 3) return 'poor';
    if (score <= 6) return 'fair';
    if (score <= 8) return 'good';
    return 'excellent';
  }

  getDurationCategory(minutes: number): 'insufficient' | 'short' | 'normal' | 'long' {
    if (minutes < 360) return 'insufficient'; // < 6 hours
    if (minutes < 420) return 'short'; // < 7 hours
    if (minutes > 540) return 'long'; // > 9 hours
    return 'normal';
  }
}

export const sleepService = new SleepService();