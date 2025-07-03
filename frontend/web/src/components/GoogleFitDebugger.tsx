// Google Fit Debugger Component
// Use this to test and debug Google Fit connection issues

import React, { useState } from 'react';
import { googleFitService } from '../services/googleFitService';

export const GoogleFitDebugger: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testEnvironmentVariables = () => {
    addLog('Testing environment variables...');
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    if (!clientId) {
      addLog('❌ VITE_GOOGLE_CLIENT_ID is not set');
      setStatus('Environment variables missing');
      return false;
    }
    
    if (!apiKey) {
      addLog('❌ VITE_GOOGLE_API_KEY is not set');
      setStatus('Environment variables missing');
      return false;
    }
    
    addLog(`✅ Client ID: ${clientId.substring(0, 20)}...`);
    addLog(`✅ API Key: ${apiKey.substring(0, 20)}...`);
    setStatus('Environment variables OK');
    return true;
  };

  const testGoogleAPIScript = () => {
    addLog('Testing Google API script...');
    
    if (typeof window !== 'undefined' && (window as any).gapi) {
      addLog('✅ Google API script loaded');
      setStatus('Google API script OK');
      return true;
    } else {
      addLog('❌ Google API script not loaded');
      setStatus('Google API script missing');
      return false;
    }
  };

  const testInitialization = async () => {
    addLog('Testing Google Fit service initialization...');
    setLoading(true);
    
    try {
      await googleFitService.initialize();
      addLog('✅ Google Fit service initialized successfully');
      setStatus('Initialization successful');
      return true;
    } catch (error: any) {
      addLog(`❌ Initialization failed: ${error.message}`);
      setStatus('Initialization failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const testAuthentication = async () => {
    addLog('Testing Google Fit authentication...');
    setLoading(true);
    
    try {
      const success = await googleFitService.authenticateUser();
      if (success) {
        addLog('✅ Authentication successful');
        setStatus('Authentication successful');
      } else {
        addLog('❌ Authentication failed');
        setStatus('Authentication failed');
      }
    } catch (error: any) {
      addLog(`❌ Authentication error: ${error.message}`);
      setStatus('Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    addLog('Testing full connection...');
    setLoading(true);
    
    try {
      const connectionStatus = await googleFitService.testConnection();
      addLog(`Connection test result: ${JSON.stringify(connectionStatus)}`);
      setStatus(connectionStatus.hasData ? 'Connection successful' : 'No data available');
    } catch (error: any) {
      addLog(`❌ Connection test failed: ${error.message}`);
      setStatus('Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async () => {
    addLog('Testing webhook integration...');
    setLoading(true);
    
    try {
      const { webhookService } = await import('../services/webhookService');
      
      // Test parsing Google Assistant response
      const testResponse = "You slept for 7 hours and 30 minutes last night. Your sleep quality was good. You went to bed at 11:30 PM and woke up at 7:00 AM.";
      addLog(`Testing with: "${testResponse}"`);
      
      const success = await webhookService.handleWebhook({
        rawText: testResponse,
        source: 'google_assistant'
      });
      
      if (success) {
        addLog('✅ Webhook test successful!');
        addLog('📊 Check History tab for new sleep session');
        setStatus('Webhook integration working');
      } else {
        addLog('❌ Webhook test failed');
        setStatus('Webhook test failed');
      }
      
      // Show IFTTT setup instructions
      addLog('');
      addLog('🔗 IFTTT Setup Instructions:');
      addLog('1. Create IFTTT account at ifttt.com');
      addLog('2. Create applet: Google Assistant → Webhooks');
      addLog('3. Phrase: "Tell Soulence how I slept"');
      addLog('4. Webhook URL: /api/webhook/sleep');
      addLog('5. Test: "Hey Google, tell Soulence how I slept"');
      
    } catch (error: any) {
      addLog(`❌ Webhook test error: ${error.message}`);
      setStatus('Webhook test failed');
    } finally {
      setLoading(false);
    }
  };

  const testDataFetch = async () => {
    addLog('Testing sleep data fetch...');
    setLoading(true);
    
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      addLog(`Fetching data from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
      
      // First check data sources
      addLog('🔍 Checking available data sources...');
      try {
        const gapi = (window as any).gapi;
        const dataSourcesResponse = await gapi.client.request({
          path: 'https://www.googleapis.com/fitness/v1/users/me/dataSources',
          method: 'GET'
        });
        
        addLog(`📊 Found ${dataSourcesResponse.result.dataSource?.length || 0} data sources`);
        
        if (dataSourcesResponse.result.dataSource) {
          const sleepSources = dataSourcesResponse.result.dataSource.filter((ds: any) => 
            ds.dataType?.name?.includes('sleep') || ds.dataStreamName?.includes('sleep')
          );
          addLog(`💤 Sleep-related sources: ${sleepSources.length}`);
          
          sleepSources.forEach((source: any, index: number) => {
            addLog(`  ${index + 1}. ${source.dataStreamName || source.dataStreamId}`);
          });
        }
      } catch (error: any) {
        addLog(`❌ Failed to check data sources: ${error.message}`);
      }
      
      const sleepData = await googleFitService.getSleepData(startDate, endDate);
      addLog(`✅ Fetched ${sleepData.length} sleep sessions`);
      
      if (sleepData.length > 0) {
        sleepData.forEach((session, index) => {
          addLog(`📊 Session ${index + 1}: ${session.sessionDate} - ${Math.round(session.totalSleepDuration / 60)}h ${session.totalSleepDuration % 60}m (Quality: ${session.qualityScore}/10)`);
        });
      } else {
        addLog('⚠️ No sleep data found. This could mean:');
        addLog('• Nest Hub Sleep Sensing discontinued (Sept 2023)');
        addLog('• No other sleep tracking devices connected');
        addLog('• No manual sleep entries in Google Fit');
        addLog('');
        addLog('💡 Recommendations:');
        addLog('• Use Soulence manual sleep logging (Log Sleep tab)');
        addLog('• Connect a wearable device (Fitbit, Wear OS)');
        addLog('• Manually log sleep in Google Fit app');
      }
      
      setStatus(`Found ${sleepData.length} sleep sessions`);
    } catch (error: any) {
      addLog(`❌ Data fetch failed: ${error.message}`);
      setStatus('Data fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const runFullTest = async () => {
    setLogs([]);
    addLog('Starting full diagnostic test...');
    
    // Test 1: Environment variables
    if (!testEnvironmentVariables()) return;
    
    // Test 2: Google API script
    if (!testGoogleAPIScript()) return;
    
    // Test 3: Initialization
    if (!(await testInitialization())) return;
    
    // Test 4: Authentication
    await testAuthentication();
  };

  const clearLogs = () => {
    setLogs([]);
    setStatus('Logs cleared');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Google Fit Debugger</h3>
      
      {/* Status */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <strong>Status:</strong> <span className={status.includes('successful') || status.includes('OK') ? 'text-green-600' : status.includes('failed') || status.includes('missing') ? 'text-red-600' : 'text-blue-600'}>{status}</span>
      </div>

      {/* Test Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={runFullTest}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Run Full Test'}
        </button>
        
        <button
          onClick={testEnvironmentVariables}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Test Env Vars
        </button>
        
        <button
          onClick={testGoogleAPIScript}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Test API Script
        </button>
        
        <button
          onClick={testInitialization}
          disabled={loading}
          className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Test Init
        </button>
        
        <button
          onClick={testAuthentication}
          disabled={loading}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Auth
        </button>
        
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Connection
        </button>
        
        <button
          onClick={testDataFetch}
          disabled={loading}
          className="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Test Data Fetch
        </button>
        
        <button
          onClick={testWebhook}
          disabled={loading}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Webhook
        </button>
        
        <button
          onClick={clearLogs}
          className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Logs
        </button>
        
        <button
          onClick={async () => {
            addLog('Testing sleep service directly...');
            try {
              const { sleepService } = await import('../services/sleepService');
              const result = await sleepService.getSessions({ limit: 30 });
              addLog(`✅ Service returned ${result.sessions.length} sessions`);
              result.sessions.forEach((session, index) => {
                addLog(`  ${index + 1}. ${session.sessionDate} - ${session.notes || 'Manual entry'}`);
              });
            } catch (error: any) {
              addLog(`❌ Service test failed: ${error.message}`);
            }
          }}
          className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Test Service
        </button>
      </div>

      {/* Environment Info */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <h4 className="font-medium text-blue-900 mb-2">Environment Check:</h4>
        <div className="space-y-1 text-blue-700">
          <div>Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}</div>
          <div>API Key: {import.meta.env.VITE_GOOGLE_API_KEY ? '✅ Set' : '❌ Missing'}</div>
          <div>Google API: {typeof window !== 'undefined' && (window as any).gapi ? '✅ Loaded' : '❌ Not loaded'}</div>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-green-300">Debug Logs</span>
          <span className="text-gray-400">{logs.length} entries</span>
        </div>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click "Run Full Test" to start.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">
              {log}
            </div>
          ))
        )}
      </div>

      {/* Quick Setup Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
        <h4 className="font-medium text-yellow-900 mb-2">Quick Setup Instructions:</h4>
        <ol className="text-yellow-700 space-y-1 list-decimal list-inside">
          <li>Create <code>.env</code> file in <code>/frontend/web/</code></li>
          <li>Add your Google credentials:
            <pre className="mt-1 p-2 bg-yellow-100 rounded text-xs">
{`VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_API_KEY=your_api_key_here`}
            </pre>
          </li>
          <li>Restart the development server</li>
          <li>Click "Run Full Test" above</li>
        </ol>
      </div>
    </div>
  );
};