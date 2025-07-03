import React from 'react';
import { EMOTION_OPTIONS, EmotionType } from '@/types/wellness';
import { Smile, Frown, Meh, Heart, Zap } from 'lucide-react';

interface MoodPickerProps {
  selectedMood: number;
  selectedEmotions: string[];
  onMoodChange: (mood: number) => void;
  onEmotionsChange: (emotions: string[]) => void;
}

// Mood level configurations
const MOOD_LEVELS = [
  { value: 1, label: 'Terrible', color: 'bg-red-500', icon: '😢', description: 'Really struggling' },
  { value: 2, label: 'Bad', color: 'bg-red-400', icon: '😞', description: 'Having a hard time' },
  { value: 3, label: 'Poor', color: 'bg-orange-400', icon: '😕', description: 'Not great' },
  { value: 4, label: 'Low', color: 'bg-orange-300', icon: '😐', description: 'Below average' },
  { value: 5, label: 'Okay', color: 'bg-yellow-400', icon: '😐', description: 'Just okay' },
  { value: 6, label: 'Fair', color: 'bg-yellow-300', icon: '🙂', description: 'Slightly better' },
  { value: 7, label: 'Good', color: 'bg-green-300', icon: '😊', description: 'Pretty good' },
  { value: 8, label: 'Great', color: 'bg-green-400', icon: '😄', description: 'Feeling great' },
  { value: 9, label: 'Amazing', color: 'bg-green-500', icon: '😁', description: 'Really amazing' },
  { value: 10, label: 'Perfect', color: 'bg-green-600', icon: '🤩', description: 'Absolutely perfect' }
];

const EMOTION_CATEGORIES = {
  positive: ['happy', 'excited', 'grateful', 'motivated', 'content', 'hopeful', 'calm'],
  negative: ['sad', 'angry', 'anxious', 'frustrated', 'overwhelmed', 'lonely', 'stressed'],
  neutral: ['confused']
};

export const MoodPicker: React.FC<MoodPickerProps> = ({
  selectedMood,
  selectedEmotions,
  onMoodChange,
  onEmotionsChange
}) => {
  const selectedMoodConfig = MOOD_LEVELS.find(level => level.value === selectedMood);

  const toggleEmotion = (emotion: string) => {
    if (selectedEmotions.includes(emotion)) {
      onEmotionsChange(selectedEmotions.filter(e => e !== emotion));
    } else {
      // Limit to 5 emotions
      if (selectedEmotions.length < 5) {
        onEmotionsChange([...selectedEmotions, emotion]);
      }
    }
  };

  const getEmotionCategory = (emotion: string): keyof typeof EMOTION_CATEGORIES => {
    for (const [category, emotions] of Object.entries(EMOTION_CATEGORIES)) {
      if (emotions.includes(emotion)) {
        return category as keyof typeof EMOTION_CATEGORIES;
      }
    }
    return 'neutral';
  };

  const getEmotionStyle = (emotion: string, isSelected: boolean) => {
    const category = getEmotionCategory(emotion);
    const baseStyle = "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-sm min-h-[44px] flex items-center justify-center";
    
    if (isSelected) {
      switch (category) {
        case 'positive':
          return `${baseStyle} bg-green-100 text-green-800 border-2 border-green-300 ring-1 ring-green-200`;
        case 'negative':
          return `${baseStyle} bg-red-100 text-red-800 border-2 border-red-300 ring-1 ring-red-200`;
        default:
          return `${baseStyle} bg-gray-100 text-gray-800 border-2 border-gray-300 ring-1 ring-gray-200`;
      }
    } else {
      switch (category) {
        case 'positive':
          return `${baseStyle} bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300`;
        case 'negative':
          return `${baseStyle} bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300`;
        default:
          return `${baseStyle} bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 hover:border-gray-300`;
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Mood Scale */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          How are you feeling today? (1-10)
        </label>
        
        <div className="space-y-4">
          {/* Visual mood selector */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {MOOD_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => onMoodChange(level.value)}
                className={`
                  relative p-3 md:p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-md min-h-[60px] md:min-h-[70px]
                  ${selectedMood === level.value 
                    ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
                style={{ minWidth: '60px' }}
              >
                <div className="text-center">
                  <div className="text-3xl md:text-4xl mb-1">{level.icon}</div>
                  <div className="text-sm md:text-base font-medium text-gray-700">{level.value}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Selected mood display */}
          {selectedMoodConfig && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">{selectedMoodConfig.icon}</div>
              <div className="text-lg font-semibold text-gray-900">{selectedMoodConfig.label}</div>
              <div className="text-sm text-gray-600">{selectedMoodConfig.description}</div>
            </div>
          )}
        </div>
      </div>

      {/* Emotion Selection */}
      <div>
        <label className="block text-lg font-medium text-gray-900 mb-4">
          What emotions are you experiencing? 
          <span className="text-sm text-gray-500 ml-2">(Select up to 5)</span>
        </label>

        <div className="space-y-4">
          {/* Positive emotions */}
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              Positive
            </h4>
            <div className="flex flex-wrap gap-2">
              {EMOTION_CATEGORIES.positive.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  disabled={!selectedEmotions.includes(emotion) && selectedEmotions.length >= 5}
                  className={getEmotionStyle(emotion, selectedEmotions.includes(emotion))}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {/* Negative emotions */}
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2 flex items-center">
              <Frown className="h-4 w-4 mr-1" />
              Challenging
            </h4>
            <div className="flex flex-wrap gap-2">
              {EMOTION_CATEGORIES.negative.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  disabled={!selectedEmotions.includes(emotion) && selectedEmotions.length >= 5}
                  className={getEmotionStyle(emotion, selectedEmotions.includes(emotion))}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>

          {/* Neutral emotions */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Meh className="h-4 w-4 mr-1" />
              Other
            </h4>
            <div className="flex flex-wrap gap-2">
              {EMOTION_CATEGORIES.neutral.map((emotion) => (
                <button
                  key={emotion}
                  type="button"
                  onClick={() => toggleEmotion(emotion)}
                  disabled={!selectedEmotions.includes(emotion) && selectedEmotions.length >= 5}
                  className={getEmotionStyle(emotion, selectedEmotions.includes(emotion))}
                >
                  {emotion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected emotions summary */}
        {selectedEmotions.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              Selected emotions ({selectedEmotions.length}/5):
            </div>
            <div className="text-sm text-blue-800">
              {selectedEmotions.join(', ')}
            </div>
          </div>
        )}
      </div>

      {/* Crisis detection warning */}
      {selectedMood <= 3 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Heart className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                We notice you're having a tough time
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Your safety and wellbeing matter to us. After logging this mood, 
                  we'll provide some helpful resources and support options.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};