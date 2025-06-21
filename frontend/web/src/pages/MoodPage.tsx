import React from 'react';
import { useForm } from 'react-hook-form';
import { useWellnessStore } from '@/stores/wellnessStore';
import { LogMoodRequest } from '@/types/wellness';
import { Layout } from '@/components/Layout';
import { MoodPicker } from '@/components/MoodPicker';
import { 
  Calendar, 
  Clock, 
  Save, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

export const MoodPage: React.FC = () => {
  const {
    logMood,
    loadTodayMood,
    hasMoodToday,
    todayMood,
    isLoading,
    error,
    clearError
  } = useWellnessStore();

  const [selectedMood, setSelectedMood] = React.useState<number>(5);
  const [selectedEmotions, setSelectedEmotions] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<LogMoodRequest>();

  // Load today's mood on component mount
  React.useEffect(() => {
    loadTodayMood();
    clearError();
  }, [loadTodayMood, clearError]);

  const onSubmit = async (formData: LogMoodRequest) => {
    try {
      const moodData: LogMoodRequest = {
        moodScore: selectedMood,
        emotions: selectedEmotions,
        notes: formData.notes
      };

      await logMood(moodData);
      
      // Show success message
      toast.success('Mood logged successfully!');
      
      // Reset form
      reset();
      setSelectedMood(5);
      setSelectedEmotions([]);
      
      // Show crisis resources if needed
      if (selectedMood <= 3) {
        toast('We\'re here to help. Check out the Crisis Support section.', {
          icon: '💙',
          duration: 5000
        });
      }
      
    } catch (error) {
      toast.error('Failed to log mood. Please try again.');
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mood Check-In</h1>
          <p className="mt-2 text-gray-600">
            Track how you're feeling to build awareness and get personalized support.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main mood logging form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg p-6">
              {/* Today's status */}
              <div className="mb-6 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      Today's Check-in
                    </span>
                  </div>
                  <div className="flex items-center">
                    {hasMoodToday ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Completed</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {hasMoodToday && todayMood && (
                  <div className="mt-3 text-sm text-gray-600">
                    Last logged: Mood {todayMood.moodScore}/10 
                    {todayMood.emotions.length > 0 && (
                      <span> • {todayMood.emotions.join(', ')}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Mood logging form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Mood Picker Component */}
                <MoodPicker
                  selectedMood={selectedMood}
                  selectedEmotions={selectedEmotions}
                  onMoodChange={setSelectedMood}
                  onEmotionsChange={setSelectedEmotions}
                />

                {/* Notes section */}
                <div>
                  <label className="block text-lg font-medium text-gray-900 mb-4">
                    What's on your mind? (Optional)
                  </label>
                  <textarea
                    {...register('notes', {
                      maxLength: {
                        value: 500,
                        message: 'Notes must be less than 500 characters'
                      }
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Share what's happening in your life, what triggered these feelings, or anything else you'd like to note..."
                  />
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                  )}
                  <div className="mt-1 text-sm text-gray-500">
                    This helps us understand patterns and provide better support.
                  </div>
                </div>

                {/* Error display */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="text-sm text-red-800">{error}</div>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || selectedMood === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Log Mood
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Track Patterns</p>
                    <p className="text-sm text-gray-600">
                      Regular check-ins help identify what affects your mood.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Eye className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Be Honest</p>
                    <p className="text-sm text-gray-600">
                      Your responses help us provide better support.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Need Help?</p>
                    <p className="text-sm text-gray-600">
                      Crisis support is always available in the Crisis Support section.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mood scale reference */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mood Scale Guide</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">1-3:</span>
                  <span className="text-red-600 font-medium">Crisis/Emergency</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">4-5:</span>
                  <span className="text-orange-600 font-medium">Struggling</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">6-7:</span>
                  <span className="text-yellow-600 font-medium">Okay/Good</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">8-10:</span>
                  <span className="text-green-600 font-medium">Great/Amazing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};