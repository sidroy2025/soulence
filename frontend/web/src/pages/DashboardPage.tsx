import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWellnessStore } from '../stores/wellnessStore';
import { useSleepStore } from '../stores/sleepStore';
import { Layout } from '../components/Layout';
import { MoodHistory } from '../components/MoodHistory';
import { 
  Heart, 
  Plus, 
  TrendingUp, 
  Calendar,
  AlertTriangle,
  BookOpen,
  Moon
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    hasMoodToday, 
    todayMood, 
    moodStats, 
    loadTodayMood, 
    loadMoodHistory 
  } = useWellnessStore();

  const {
    todaysSession,
    analytics,
    fetchTodaysSession,
    fetchAnalytics
  } = useSleepStore();

  React.useEffect(() => {
    const initializeDashboard = async () => {
      try {
        console.log('Dashboard: Loading mood data...');
        await loadTodayMood();
        await loadMoodHistory();
        console.log('Dashboard: Mood data loaded');
      } catch (error) {
        console.error('Dashboard: Failed to load mood data:', error);
      }

      try {
        console.log('Dashboard: Loading sleep data...');
        await fetchTodaysSession();
        await fetchAnalytics('7d');
        console.log('Dashboard: Sleep data loaded');
      } catch (error) {
        console.error('Dashboard: Failed to load sleep data:', error);
      }
    };

    initializeDashboard();
  }, [loadTodayMood, loadMoodHistory, fetchTodaysSession, fetchAnalytics]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    if (hasMoodToday && todayMood) {
      if (todayMood.moodScore >= 8) {
        return "You're having an amazing day! Keep up the positive energy.";
      } else if (todayMood.moodScore >= 6) {
        return "You're doing well today. Remember to take care of yourself.";
      } else if (todayMood.moodScore >= 4) {
        return "Today might be challenging, but you're not alone. We're here to help.";
      } else {
        return "We notice you're having a tough day. Please consider reaching out for support.";
      }
    }
    return "How are you feeling today? Your daily check-in helps us provide better support.";
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.email?.split('@')[0] || 'there'}!
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            {getMotivationalMessage()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Today's Mood Status */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-primary-600" />
                  Today's Check-in
                </h2>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {hasMoodToday && todayMood ? (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">
                        {todayMood.moodScore >= 8 ? '😄' : 
                         todayMood.moodScore >= 6 ? '😊' : 
                         todayMood.moodScore >= 4 ? '😐' : '😞'}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          Mood: {todayMood.moodScore}/10
                        </p>
                        {todayMood.emotions.length > 0 && (
                          <p className="text-sm text-gray-600">
                            {todayMood.emotions.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/mood"
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Update
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">You haven't logged your mood today yet.</p>
                  <Link
                    to="/mood"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your Mood
                  </Link>
                </div>
              )}
            </div>

            {/* Mood History */}
            <MoodHistory limit={5} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            {moodStats && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Average Mood</span>
                      <span className="font-medium">{moodStats.averageScore.toFixed(1)}/10</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${(moodStats.averageScore / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Check-in Streak</span>
                    <span className="font-medium">{moodStats.consecutiveDays} days</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Logs</span>
                    <span className="font-medium">{moodStats.totalLogs}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sleep Summary */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Moon className="h-5 w-5 mr-2 text-purple-600" />
                Sleep Summary
              </h3>
              
              {todaysSession ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Night</span>
                    <span className="font-medium">
                      {todaysSession.totalSleepDuration ? 
                        `${Math.floor(todaysSession.totalSleepDuration / 60)}h ${todaysSession.totalSleepDuration % 60}m` 
                        : 'N/A'
                      }
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quality</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">
                        {todaysSession.qualityScore || 'N/A'}
                      </span>
                      {todaysSession.qualityScore && (
                        <span className="text-xs text-gray-500">/10</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Energy Level</span>
                    <div className="flex items-center">
                      <span className="font-medium mr-1">
                        {todaysSession.energyLevel || 'N/A'}
                      </span>
                      {todaysSession.energyLevel && (
                        <span className="text-xs text-gray-500">/10</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="relative">
                    <Moon className="h-12 w-12 text-purple-200 mx-auto mb-3" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs">💤</span>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Track your first sleep session</h4>
                  <p className="text-xs text-gray-500 mb-4">Understanding your sleep patterns helps improve your overall wellness</p>
                  <Link
                    to="/sleep"
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors duration-200"
                  >
                    <Moon className="h-4 w-4 mr-1" />
                    Log Sleep
                  </Link>
                </div>
              )}
              
              {analytics && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-2">7-Day Average</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {Math.floor(analytics.averageSleepDuration / 60)}h {analytics.averageSleepDuration % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quality:</span>
                    <span className="font-medium">{analytics.averageQualityScore.toFixed(1)}/10</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/mood"
                  className="w-full flex items-center justify-center px-4 py-2 border border-primary-300 text-primary-700 rounded-md hover:bg-primary-50 transition-colors"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Log Mood
                </Link>
                
                <Link
                  to="/sleep"
                  className="w-full flex items-center justify-center px-4 py-2 border border-purple-300 text-purple-700 rounded-md hover:bg-purple-50 transition-colors"
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Log Sleep
                </Link>
                
                
                <Link
                  to="/crisis"
                  className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Crisis Support
                </Link>
              </div>
            </div>

            {/* Motivational Quote */}
            <div className="bg-gradient-to-r from-primary-50 to-wellness-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Inspiration</h3>
              <blockquote className="text-sm text-gray-700 italic">
                "Mental health is not a destination, but a process. It's about how you drive, not where you're going."
              </blockquote>
              <cite className="text-xs text-gray-500 mt-2 block">— Noam Shpancer</cite>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};