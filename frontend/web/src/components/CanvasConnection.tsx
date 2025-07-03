import React, { useEffect } from 'react';
import { useAcademicStore } from '../stores/academicStore';

const CanvasConnection: React.FC = () => {
  const {
    canvasConnection,
    isConnecting,
    isLoading,
    error,
    fetchCanvasStatus,
    connectCanvas,
    disconnectCanvas,
    syncCanvasData,
    clearError
  } = useAcademicStore();

  useEffect(() => {
    fetchCanvasStatus();
  }, [fetchCanvasStatus]);

  useEffect(() => {
    // Listen for Canvas OAuth completion
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'CANVAS_OAUTH_SUCCESS') {
        fetchCanvasStatus();
        // Refresh data after successful connection
        syncCanvasData();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchCanvasStatus, syncCanvasData]);

  const handleConnect = async () => {
    try {
      await connectCanvas();
    } catch (error) {
      console.error('Canvas connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Canvas? This will remove all Canvas assignments and data.')) {
      try {
        await disconnectCanvas();
      } catch (error) {
        console.error('Canvas disconnection failed:', error);
      }
    }
  };

  const handleSync = async () => {
    try {
      await syncCanvasData();
    } catch (error) {
      console.error('Canvas sync failed:', error);
    }
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-red-800">Connection Error</h3>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  if (isLoading && !canvasConnection) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading Canvas connection status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Canvas LMS Integration</h2>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
          canvasConnection?.isConnected 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            canvasConnection?.isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
          {canvasConnection?.isConnected ? 'Connected' : 'Not Connected'}
        </div>
      </div>

      {canvasConnection?.isConnected ? (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Connection Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Canvas User:</strong> {canvasConnection.canvasUserName}</p>
              <p><strong>Email:</strong> {canvasConnection.canvasUserEmail}</p>
              <p><strong>Connected:</strong> {canvasConnection.connectedAt?.toLocaleDateString()}</p>
              <p><strong>Last Sync:</strong> {canvasConnection.lastSyncedAt?.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSync}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Sync Now</span>
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Disconnect
            </button>
          </div>

          <div className="text-xs text-gray-500">
            <p>📋 Canvas assignments sync automatically every 15 minutes</p>
            <p>⚠️ Canvas assignments cannot be edited directly in Soulence</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-6">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M24 6v6m0 0v6m0-6h6m-6 0h-6m12 18v6m0 0v6m0-6h6m-6 0h-6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect to Canvas</h3>
            <p className="text-gray-600 mb-6">
              Connect your Canvas account to automatically sync assignments, due dates, and grades. 
              This helps Soulence provide better academic stress management and task prioritization.
            </p>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
              <h4 className="font-medium text-blue-900 mb-2">What gets synced:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Active courses and course information</li>
                <li>• Assignment titles, descriptions, and due dates</li>
                <li>• Assignment grades and submission status</li>
                <li>• Course grades and performance data</li>
              </ul>
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Connect Canvas</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>🔒 Your Canvas credentials are securely stored and encrypted</p>
            <p>📱 You'll be redirected to Canvas to authorize the connection</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasConnection;