import React, { useState, useEffect } from 'react';

const GoogleFitIntegration = () => {
  // All state variables properly defined
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sleepData, setSleepData] = useState<any[]>([]);

  // Initialize on component mount
  useEffect(() => {
    initializeGoogleFit();
  }, []);

  const initializeGoogleFit = async () => {
    try {
      // Check if Google API is loaded
      if (typeof window.gapi === 'undefined') {
        setError('Google API not loaded. Please refresh the page.');
        return;
      }

      // Check if Client ID is set
      if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        setError('Google Client ID not configured.');
        return;
      }

      // Load auth2
      await new Promise((resolve) => {
        window.gapi.load('auth2', resolve);
      });

      // Initialize auth
      const authInstance = await window.gapi.auth2.init({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: [
          'https://www.googleapis.com/auth/fitness.sleep.read',
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' ')
      });

      // Check if already signed in
      setIsConnected(authInstance.isSignedIn.get());

      if (authInstance.isSignedIn.get()) {
        loadMockSleepData(); // Load some sample data
      }

    } catch (err: any) {
      console.error('Failed to initialize Google Fit:', err);
      setError(`Initialization failed: ${err.message}`);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      setIsConnected(true);
      loadMockSleepData(); // Load sample data after connection
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(`Connection failed: ${err.error || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setIsConnected(false);
      setSleepData([]);
    } catch (err: any) {
      setError(`Disconnect failed: ${err.message}`);
    }
  };

  // Load mock sleep data for demonstration
  const loadMockSleepData = () => {
    const mockData = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const sleepDate = new Date(today);
      sleepDate.setDate(today.getDate() - i);
      sleepDate.setHours(23, 0, 0, 0);
      
      const wakeDate = new Date(sleepDate);
      wakeDate.setHours(7, 30, 0, 0);
      wakeDate.setDate(wakeDate.getDate() + 1);

      const duration = wakeDate.getTime() - sleepDate.getTime();
      const quality = Math.floor(Math.random() * 30) + 70; // 70-100

      mockData.push({
        id: `sleep_${i}`,
        date: sleepDate.toLocaleDateString(),
        duration: duration,
        quality: quality,
        stages: {
          light: duration * 0.5,
          deep: duration * 0.2,
          rem: duration * 0.25,
          awake: duration * 0.05
        }
      });
    }
    setSleepData(mockData);
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 85) return 'text-green-600';
    if (quality >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Google Fit Integration</h2>
          <p className="text-gray-600 mt-1">
            Connect to sync Nest Hub sleep data with Soulence
          </p>
        </div>
        
        {isConnected && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-medium">Connected</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📱</div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Google Fit</h3>
          <p className="text-gray-500 mb-6">
            Sync your sleep data from Nest Hub and other devices
          </p>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect Google Fit'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sleep Data</h3>
              <p className="text-gray-600">Last 7 days</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Disconnect
            </button>
          </div>

          <div className="grid gap-4">
            {sleepData.map((sleep) => (
              <div key={sleep.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">{sleep.date}</h4>
                    <p className="text-sm text-gray-600">
                      Duration: {formatDuration(sleep.duration)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getQualityColor(sleep.quality)}`}>
                      {sleep.quality}
                    </div>
                    <div className="text-sm text-gray-600">Quality</div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center text-sm">
                  <div>
                    <div className="font-medium text-yellow-600">
                      {Math.round((sleep.stages.light / sleep.duration) * 100)}%
                    </div>
                    <div className="text-gray-600">Light</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-600">
                      {Math.round((sleep.stages.deep / sleep.duration) * 100)}%
                    </div>
                    <div className="text-gray-600">Deep</div>
                  </div>
                  <div>
                    <div className="font-medium text-purple-600">
                      {Math.round((sleep.stages.rem / sleep.duration) * 100)}%
                    </div>
                    <div className="text-gray-600">REM</div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">
                      {Math.round((sleep.stages.awake / sleep.duration) * 100)}%
                    </div>
                    <div className="text-gray-600">Awake</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 italic">
                  * Sample data for demonstration
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleFitIntegration;