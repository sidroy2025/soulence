import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { useWellnessStore } from '../stores/wellnessStore';
import { useSleepStore } from '../stores/sleepStore';

export const DebugInfo: React.FC = () => {
  const authStore = useAuthStore();
  const wellnessStore = useWellnessStore();
  const sleepStore = useSleepStore();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>Auth: {authStore.isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User: {authStore.user?.email || 'None'}</div>
        <div>Loading: {authStore.isLoading ? 'Yes' : 'No'}</div>
        <div>Wellness Error: {wellnessStore.error || 'None'}</div>
        <div>Sleep Error: {sleepStore.error || 'None'}</div>
      </div>
    </div>
  );
};