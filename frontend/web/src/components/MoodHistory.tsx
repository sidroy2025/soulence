import React from 'react';
import { useWellnessStore } from '@/stores/wellnessStore';
import { MoodLog } from '@/types/wellness';
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';

interface MoodHistoryProps {
  limit?: number;
  showActions?: boolean;
}

export const MoodHistory: React.FC<MoodHistoryProps> = ({ 
  limit = 10, 
  showActions = false 
}) => {
  const {
    moodLogs,
    moodStats,
    loadMoodHistory,
    deleteMoodLog,
    isLoading
  } = useWellnessStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadMoodHistory();
  }, [loadMoodHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getMoodColor = (score: number) => {
    if (score <= 3) return 'text-red-600 bg-red-50';
    if (score <= 5) return 'text-orange-600 bg-orange-50';
    if (score <= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getMoodEmoji = (score: number) => {
    if (score <= 2) return '😢';
    if (score <= 4) return '😞';
    if (score <= 6) return '😐';
    if (score <= 8) return '😊';
    return '😄';
  };

  const getTrendIcon = () => {
    if (!moodStats) return <Minus className="h-4 w-4" />;
    
    switch (moodStats.trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleDelete = async (moodId: string) => {
    try {
      await deleteMoodLog(moodId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete mood log:', error);
    }
  };

  const displayedLogs = limit ? moodLogs.slice(0, limit) : moodLogs;

  if (isLoading && moodLogs.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      {moodStats && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Mood Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {moodStats.averageScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {moodStats.consecutiveDays}
              </div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {moodStats.totalLogs}
              </div>
              <div className="text-sm text-gray-600">Total Logs</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-2xl">
                {getTrendIcon()}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {moodStats.trend}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood History List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Recent Mood Logs
          </h3>
        </div>

        {displayedLogs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No mood logs yet. Start by logging your first mood!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Mood Score */}
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(log.moodScore)}`}>
                      <span className="mr-1">{getMoodEmoji(log.moodScore)}</span>
                      {log.moodScore}/10
                    </div>

                    {/* Log Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                        <span>{formatDate(log.loggedAt)}</span>
                        <span>•</span>
                        <span>{formatTime(log.loggedAt)}</span>
                      </div>

                      {/* Emotions */}
                      {log.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {log.emotions.map((emotion) => (
                            <span
                              key={emotion}
                              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                            >
                              {emotion}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {log.notes && (
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex items-center space-x-2">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowDeleteConfirm(log.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm === log.id && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800 mb-3">
                      Are you sure you want to delete this mood log?
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View More Link */}
        {moodLogs.length > limit && (
          <div className="px-6 py-4 border-t border-gray-200 text-center">
            <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All Mood Logs ({moodLogs.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};