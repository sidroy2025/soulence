// Sleep Log Form Component
// Form for logging sleep sessions with comprehensive data collection

import React, { useState, useEffect } from 'react';
import { useSleepStore } from '../stores/sleepStore';
import { SleepSession, CreateSleepSessionRequest } from '../types/sleep';

interface SleepLogFormProps {
  session?: SleepSession | null;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export const SleepLogForm: React.FC<SleepLogFormProps> = ({ 
  session, 
  onSubmit, 
  onCancel 
}) => {
  const { createSession, updateSession, loading, error } = useSleepStore();
  
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    bedtime: '',
    wakeTime: '',
    qualityScore: 7,
    energyLevel: 7,
    moodUponWaking: '',
    stressLevelBeforeBed: 5,
    caffeineAfter2pm: false,
    alcoholConsumed: false,
    exerciseDay: false,
    screenTimeBeforeBed: 60,
    roomTemperature: 'comfortable' as const,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing existing session
  useEffect(() => {
    if (session) {
      setFormData({
        sessionDate: session.sessionDate,
        bedtime: session.bedtime ? new Date(session.bedtime).toTimeString().slice(0, 5) : '',
        wakeTime: session.wakeTime ? new Date(session.wakeTime).toTimeString().slice(0, 5) : '',
        qualityScore: session.qualityScore || 7,
        energyLevel: session.energyLevel || 7,
        moodUponWaking: session.moodUponWaking || '',
        stressLevelBeforeBed: session.stressLevelBeforeBed || 5,
        caffeineAfter2pm: session.caffeineAfter2pm || false,
        alcoholConsumed: session.alcoholConsumed || false,
        exerciseDay: session.exerciseDay || false,
        screenTimeBeforeBed: session.screenTimeBeforeBed || 60,
        roomTemperature: session.roomTemperature || 'comfortable',
        notes: session.notes || ''
      });
    }
  }, [session]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sessionDate) {
      newErrors.sessionDate = 'Date is required';
    }

    if (formData.bedtime && formData.wakeTime) {
      const bedtime = new Date(`${formData.sessionDate}T${formData.bedtime}`);
      let wakeTime = new Date(`${formData.sessionDate}T${formData.wakeTime}`);
      
      // If wake time is earlier than bedtime, assume it's the next day
      if (wakeTime < bedtime) {
        wakeTime = new Date(wakeTime.getTime() + 24 * 60 * 60 * 1000);
      }
      
      const duration = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60);
      if (duration < 60) { // Less than 1 hour
        newErrors.wakeTime = 'Sleep duration seems too short';
      } else if (duration > 16 * 60) { // More than 16 hours
        newErrors.wakeTime = 'Sleep duration seems too long';
      }
    }

    if (formData.qualityScore < 1 || formData.qualityScore > 10) {
      newErrors.qualityScore = 'Quality score must be between 1 and 10';
    }

    if (formData.energyLevel < 1 || formData.energyLevel > 10) {
      newErrors.energyLevel = 'Energy level must be between 1 and 10';
    }

    if (formData.stressLevelBeforeBed < 1 || formData.stressLevelBeforeBed > 10) {
      newErrors.stressLevelBeforeBed = 'Stress level must be between 1 and 10';
    }

    if (formData.screenTimeBeforeBed < 0 || formData.screenTimeBeforeBed > 480) {
      newErrors.screenTimeBeforeBed = 'Screen time must be between 0 and 480 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const sessionData: CreateSleepSessionRequest = {
        sessionDate: formData.sessionDate,
        bedtime: formData.bedtime ? `${formData.sessionDate}T${formData.bedtime}:00.000Z` : undefined,
        wakeTime: formData.wakeTime ? 
          (() => {
            const wakeDate = new Date(`${formData.sessionDate}T${formData.wakeTime}:00.000Z`);
            const bedDate = formData.bedtime ? new Date(`${formData.sessionDate}T${formData.bedtime}:00.000Z`) : null;
            
            // If wake time is earlier than bedtime, it's the next day
            if (bedDate && wakeDate < bedDate) {
              wakeDate.setDate(wakeDate.getDate() + 1);
            }
            
            return wakeDate.toISOString();
          })() : undefined,
        qualityScore: formData.qualityScore,
        energyLevel: formData.energyLevel,
        moodUponWaking: formData.moodUponWaking || undefined,
        stressLevelBeforeBed: formData.stressLevelBeforeBed,
        caffeineAfter2pm: formData.caffeineAfter2pm,
        alcoholConsumed: formData.alcoholConsumed,
        exerciseDay: formData.exerciseDay,
        screenTimeBeforeBed: formData.screenTimeBeforeBed,
        roomTemperature: formData.roomTemperature,
        notes: formData.notes || undefined
      };

      if (session) {
        await updateSession(session.id, sessionData);
      } else {
        await createSession(sessionData);
      }

      onSubmit?.();
    } catch (error) {
      console.error('Failed to save sleep session:', error);
    }
  };

  const getQualityEmoji = (score: number): string => {
    if (score <= 2) return '😴';
    if (score <= 4) return '😑';
    if (score <= 6) return '🙂';
    if (score <= 8) return '😊';
    return '😁';
  };

  const getEnergyEmoji = (level: number): string => {
    if (level <= 2) return '🔋';
    if (level <= 4) return '🔋';
    if (level <= 6) return '🔋';
    if (level <= 8) return '🔋';
    return '⚡';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {session ? 'Edit Sleep Session' : 'Log Sleep Session'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Date
          </label>
          <input
            type="date"
            value={formData.sessionDate}
            onChange={(e) => handleInputChange('sessionDate', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.sessionDate ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.sessionDate && <p className="mt-1 text-sm text-red-600">{errors.sessionDate}</p>}
        </div>

        {/* Sleep Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedtime
            </label>
            <input
              type="time"
              value={formData.bedtime}
              onChange={(e) => handleInputChange('bedtime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wake Time
            </label>
            <input
              type="time"
              value={formData.wakeTime}
              onChange={(e) => handleInputChange('wakeTime', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.wakeTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.wakeTime && <p className="mt-1 text-sm text-red-600">{errors.wakeTime}</p>}
          </div>
        </div>

        {/* Quality Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Quality {getQualityEmoji(formData.qualityScore)} ({formData.qualityScore}/10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.qualityScore}
            onChange={(e) => handleInputChange('qualityScore', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Energy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Energy Level Upon Waking {getEnergyEmoji(formData.energyLevel)} ({formData.energyLevel}/10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.energyLevel}
            onChange={(e) => handleInputChange('energyLevel', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Exhausted</span>
            <span>Energized</span>
          </div>
        </div>

        {/* Mood Upon Waking */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mood Upon Waking
          </label>
          <select
            value={formData.moodUponWaking}
            onChange={(e) => handleInputChange('moodUponWaking', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select mood...</option>
            <option value="refreshed">Refreshed 😌</option>
            <option value="groggy">Groggy 😵</option>
            <option value="tired">Tired 😴</option>
            <option value="alert">Alert 😊</option>
            <option value="irritable">Irritable 😤</option>
            <option value="happy">Happy 😄</option>
            <option value="neutral">Neutral 😐</option>
          </select>
        </div>

        {/* Stress Level Before Bed */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stress Level Before Bed ({formData.stressLevelBeforeBed}/10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={formData.stressLevelBeforeBed}
            onChange={(e) => handleInputChange('stressLevelBeforeBed', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Relaxed</span>
            <span>Very Stressed</span>
          </div>
        </div>

        {/* Environmental & Behavioral Factors */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Factors That May Have Affected Sleep</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.caffeineAfter2pm}
                onChange={(e) => handleInputChange('caffeineAfter2pm', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Caffeine after 2 PM</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.alcoholConsumed}
                onChange={(e) => handleInputChange('alcoholConsumed', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Alcohol consumed</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.exerciseDay}
                onChange={(e) => handleInputChange('exerciseDay', e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">Exercised today</span>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Screen time before bed (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="480"
                value={formData.screenTimeBeforeBed}
                onChange={(e) => handleInputChange('screenTimeBeforeBed', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room temperature
              </label>
              <select
                value={formData.roomTemperature}
                onChange={(e) => handleInputChange('roomTemperature', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="cold">Cold ❄️</option>
                <option value="cool">Cool 🌡️</option>
                <option value="comfortable">Comfortable 🌡️</option>
                <option value="warm">Warm 🌡️</option>
                <option value="hot">Hot 🔥</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Any additional notes about your sleep..."
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 border border-gray-300 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : session ? 'Update Session' : 'Log Sleep'}
          </button>
        </div>
      </form>
    </div>
  );
};