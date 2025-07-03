// Device Connection Manager Component
// Manages connections to sleep tracking devices

import React, { useState, useEffect } from 'react';
import { sleepService } from '../services/sleepService';
import { CheckCircle, XCircle, Smartphone, Watch, Wifi, RefreshCw } from 'lucide-react';

interface ConnectedDevice {
  type: 'google_fit' | 'samsung_health' | 'fitbit' | 'apple_health';
  name: string;
  isConnected: boolean;
  lastSync?: Date;
}

interface DeviceConnectionManagerProps {
  onDeviceConnected?: (deviceType: string) => void;
  onDeviceDisconnected?: (deviceType: string) => void;
}

export const DeviceConnectionManager: React.FC<DeviceConnectionManagerProps> = ({
  onDeviceConnected,
  onDeviceDisconnected
}) => {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const connectedDevices = await sleepService.getConnectedDevices();
      setDevices(connectedDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
      setError('Failed to load device connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (deviceType: 'google_fit' | 'samsung_health') => {
    try {
      setError(null);
      const success = await sleepService.connectDevice(deviceType);
      
      if (success) {
        await loadDevices(); // Refresh device list
        onDeviceConnected?.(deviceType);
      } else {
        setError(`Failed to connect to ${deviceType.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error(`Connection error for ${deviceType}:`, error);
      setError(`Failed to connect to ${deviceType.replace('_', ' ')}`);
    }
  };

  const handleDisconnect = async (deviceType: 'google_fit' | 'samsung_health') => {
    try {
      setError(null);
      await sleepService.disconnectDevice(deviceType);
      await loadDevices(); // Refresh device list
      onDeviceDisconnected?.(deviceType);
    } catch (error) {
      console.error(`Disconnection error for ${deviceType}:`, error);
      setError(`Failed to disconnect from ${deviceType.replace('_', ' ')}`);
    }
  };

  const handleSync = async (deviceType: 'google_fit' | 'samsung_health') => {
    try {
      setSyncing(deviceType);
      setError(null);
      
      let syncedCount = 0;
      
      if (deviceType === 'google_fit') {
        const syncedSessions = await sleepService.syncFromGoogleFit();
        syncedCount = syncedSessions.length;
        console.log(`🎯 Sync completed: ${syncedCount} sessions synced`);
      } else if (deviceType === 'samsung_health') {
        const syncedSessions = await sleepService.syncFromSamsungHealth();
        syncedCount = syncedSessions.length;
      }
      
      await loadDevices(); // Refresh device list
      
      // Notify parent component about sync completion with count
      if (typeof window !== 'undefined') {
        console.log('📡 Dispatching sleepDataSynced event...');
        window.dispatchEvent(new CustomEvent('sleepDataSynced', { 
          detail: { deviceType, syncedCount, timestamp: new Date() } 
        }));
        
        // Also dispatch a more specific refresh event
        window.dispatchEvent(new CustomEvent('refreshSleepData', { 
          detail: { source: 'device_sync', syncedCount } 
        }));
      }
    } catch (error) {
      console.error(`Sync error for ${deviceType}:`, error);
      setError(`Failed to sync data from ${deviceType.replace('_', ' ')}`);
    } finally {
      setSyncing(null);
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'google_fit':
        return <Smartphone className="h-5 w-5" />;
      case 'samsung_health':
        return <Watch className="h-5 w-5" />;
      case 'fitbit':
        return <Watch className="h-5 w-5" />;
      case 'apple_health':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <Wifi className="h-5 w-5" />;
    }
  };

  const formatLastSync = (date?: Date): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Connected Devices</h3>
        <button
          onClick={loadDevices}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-600">Loading devices...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.type}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="text-gray-600">
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{device.name}</h4>
                  <p className="text-sm text-gray-500">
                    Last sync: {formatLastSync(device.lastSync)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Connection Status */}
                <div className="flex items-center space-x-2">
                  {device.isConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${
                    device.isConnected ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {device.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  {device.isConnected ? (
                    <>
                      <button
                        onClick={() => handleSync(device.type as any)}
                        disabled={syncing === device.type}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        {syncing === device.type ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Syncing...</span>
                          </>
                        ) : (
                          <span>Sync</span>
                        )}
                      </button>
                      <button
                        onClick={() => handleDisconnect(device.type as any)}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(device.type as any)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {devices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Wifi className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No devices available for connection</p>
              <p className="text-sm">Check that you have Google Fit or Samsung Health installed</p>
            </div>
          )}
        </div>
      )}

      {/* Information Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📱 Supported Devices</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Google Fit:</strong> Android devices, Wear OS watches, fitness trackers</li>
          <li>• <strong>Samsung Health:</strong> Samsung Galaxy devices, Galaxy Watch series</li>
          <li>• <strong>Note:</strong> Google Nest Hub Sleep Sensing was discontinued in September 2023</li>
        </ul>
      </div>
    </div>
  );
};