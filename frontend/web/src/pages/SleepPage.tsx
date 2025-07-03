// Sleep Page
// Main sleep monitoring dashboard with tabs for different views

import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { SleepLogForm } from '../components/SleepLogForm';
import { DeviceConnectionManager } from '../components/DeviceConnectionManager';
import { GoogleFitDebugger } from '../components/GoogleFitDebugger';
import { useSleepStore } from '../stores/sleepStore';
import { sleepService } from '../services/sleepService';

export const SleepPage: React.FC = () => {
  const {
    sessions,
    todaysSession,
    analytics,
    insights,
    loading,
    error,
    fetchTodaysSession,
    fetchSessions,
    fetchAnalytics,
    fetchInsights,
    clearError
  } = useSleepStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'history' | 'insights' | 'devices' | 'debug'>('overview');
  const [showLogForm, setShowLogForm] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchTodaysSession();
    fetchSessions({ limit: 30 }); // Increased to 30 days to show synced data
    fetchAnalytics('7d');
    fetchInsights();

    // Listen for sleep data sync events
    const handleSleepDataSynced = (event: CustomEvent) => {
      console.log('🔄 Sleep data synced, refreshing...', event.detail);
      console.log('📊 Current sessions count before refresh:', sessions.length);
      
      // Add a small delay to ensure data is fully saved
      setTimeout(() => {
        fetchTodaysSession();
        fetchSessions({ limit: 30 });
        fetchAnalytics('7d');
        fetchInsights();
      }, 100);
    };

    const handleRefreshSleepData = (event: CustomEvent) => {
      console.log('🔄 Refresh sleep data event received:', event.detail);
      fetchSessions({ limit: 30 });
    };

    window.addEventListener('sleepDataSynced', handleSleepDataSynced as EventListener);
    window.addEventListener('refreshSleepData', handleRefreshSleepData as EventListener);

    return () => {
      window.removeEventListener('sleepDataSynced', handleSleepDataSynced as EventListener);
      window.removeEventListener('refreshSleepData', handleRefreshSleepData as EventListener);
    };
  }, []);

  const handleLogSubmit = () => {
    setShowLogForm(false);
    // Refresh data after logging
    fetchTodaysSession();
    fetchSessions({ limit: 7 });
    fetchAnalytics('7d');
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString: string): string => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Invalid time format:', isoString);
      return '-';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Invalid Date';
    try {
      // Handle both YYYY-MM-DD and full ISO date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as-is if it's already formatted
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString;
    }
  };

  const getQualityColor = (score: number): string => {
    if (score <= 3) return 'text-red-600 bg-red-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    if (score <= 8) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getQualityText = (score: number): string => {
    if (score <= 3) return 'Poor';
    if (score <= 6) return 'Fair';
    if (score <= 8) return 'Good';
    return 'Excellent';
  };

  const SleepOverview = () => (
    <div className="space-y-6">
      {/* Today's Sleep Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Today's Sleep</h3>
          <button
            onClick={() => setShowLogForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {todaysSession ? 'Edit' : 'Log Sleep'}
          </button>
        </div>
        
        {todaysSession ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {todaysSession.totalSleepDuration ? formatDuration(todaysSession.totalSleepDuration) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getQualityColor(todaysSession.qualityScore || 0)}`}>
                {todaysSession.qualityScore ? `${todaysSession.qualityScore}/10` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {todaysSession.energyLevel ? `${todaysSession.energyLevel}/10` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Energy</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-6xl mb-4">🌙</div>
            <p>No sleep logged for today</p>
            <p className="text-sm">Tap "Log Sleep" to get started</p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-purple-600">
            {analytics?.averageSleepDuration ? formatDuration(analytics.averageSleepDuration) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Avg Duration</div>
          <div className="text-xs text-gray-500">Last 7 days</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-blue-600">
            {analytics?.averageQualityScore ? `${analytics.averageQualityScore.toFixed(1)}/10` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Avg Quality</div>
          <div className="text-xs text-gray-500">Last 7 days</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-green-600">
            {analytics?.averageEfficiency ? `${analytics.averageEfficiency.toFixed(0)}%` : 'N/A'}
          </div>
          <div className="text-sm text-gray-600">Efficiency</div>
          <div className="text-xs text-gray-500">Last 7 days</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {sessions.length}
          </div>
          <div className="text-sm text-gray-600">Sessions</div>
          <div className="text-xs text-gray-500">Last 7 days</div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sleep Sessions</h3>
        
        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
          <strong>Debug Overview:</strong> Found {sessions.length} sessions in store
        </div>
        
        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {session.bedtime && session.wakeTime ? (
                      `${formatTime(session.bedtime)} → ${formatTime(session.wakeTime)}`
                    ) : 'Times not logged'}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {session.totalSleepDuration ? formatDuration(session.totalSleepDuration) : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">Duration</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`px-2 py-1 rounded text-sm font-medium ${getQualityColor(session.qualityScore || 0)}`}>
                      {session.qualityScore ? getQualityText(session.qualityScore) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No sleep sessions logged yet</p>
          </div>
        )}
      </div>

      {/* Insights Preview */}
      {insights.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep Insights</h3>
          <div className="space-y-3">
            {insights.slice(0, 2).map((insight) => (
              <div key={insight.id} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">{insight.title}</h4>
                    <p className="text-sm text-blue-700 mt-1">{insight.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setActiveTab('insights')}
            className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all insights →
          </button>
        </div>
      )}
    </div>
  );

  const SleepHistory = () => {
    // Debug logging for History tab
    console.log('🔍 SleepHistory render - sessions.length:', sessions.length);
    console.log('📊 Sessions data:', sessions);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sleep History</h3>
        
        {/* Debug info */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
          <strong>Debug:</strong> Found {sessions.length} sessions in store
          <button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              fetchSessions({ limit: 30 });
            }}
            className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
          >
            Refresh
          </button>
        </div>
        
        {sessions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bedtime
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wake Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Energy
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(session.sessionDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.bedtime ? formatTime(session.bedtime) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(session.wakeTime || session.wake_time) ? formatTime(session.wakeTime || session.wake_time) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(session.totalSleepDuration || session.total_sleep_duration) ? formatDuration(session.totalSleepDuration || session.total_sleep_duration) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(session.qualityScore || session.quality_score) ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getQualityColor(session.qualityScore || session.quality_score)}`}>
                        {(session.qualityScore || session.quality_score)}/10
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(session.energyLevel || session.energy_level) ? `${(session.energyLevel || session.energy_level)}/10` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>No sleep history available</p>
        </div>
      )}
    </div>
    );
  };

  const SleepInsights = () => (
    <div className="space-y-4">
      {insights.length > 0 ? (
        insights.map((insight) => (
          <div key={insight.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                <p className="text-gray-600 mt-1">{insight.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                insight.priority === 'high' ? 'bg-red-100 text-red-800' :
                insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {insight.priority}
              </span>
            </div>
            
            {insight.recommendations && insight.recommendations.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {insight.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Difficulty: {insight.difficulty}</span>
                <span>Impact: {insight.expectedImpact}</span>
              </div>
              
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800">
                  Mark as viewed
                </button>
                <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl mb-2">💡</div>
          <p className="text-gray-500">No insights available yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Log more sleep sessions to get personalized insights
          </p>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sleep Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Track your sleep patterns and get insights for better rest
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="mt-2 text-gray-600">Loading sleep data...</p>
          </div>
        )}

        {/* Sleep Log Form Modal */}
        {showLogForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
              <SleepLogForm
                session={todaysSession}
                onSubmit={handleLogSubmit}
                onCancel={() => setShowLogForm(false)}
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'log', label: 'Log Sleep' },
              { key: 'history', label: 'History' },
              { key: 'insights', label: 'Insights' },
              { key: 'devices', label: 'Devices' },
              { key: 'debug', label: 'Debug' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <SleepOverview />}
          {activeTab === 'log' && (
            <SleepLogForm
              session={todaysSession}
              onSubmit={() => {
                fetchTodaysSession();
                fetchSessions({ limit: 7 });
                fetchAnalytics('7d');
                setActiveTab('overview');
              }}
            />
          )}
          {activeTab === 'history' && <SleepHistory />}
          {activeTab === 'insights' && <SleepInsights />}
          {activeTab === 'devices' && (
            <DeviceConnectionManager
              onDeviceConnected={(deviceType) => {
                console.log(`Connected to ${deviceType}`);
                // Refresh data after device connection
                fetchTodaysSession();
                fetchSessions({ limit: 7 });
                fetchAnalytics('7d');
              }}
              onDeviceDisconnected={(deviceType) => {
                console.log(`Disconnected from ${deviceType}`);
              }}
            />
          )}
          {activeTab === 'debug' && <GoogleFitDebugger />}
        </div>
      </div>
    </Layout>
  );
};