import React, { useState, useEffect } from 'react';
import { useAcademicStore } from '../stores/academicStore';
import { Layout } from '../components/Layout';
import CanvasConnection from '../components/CanvasConnection';
import TaskList from '../components/TaskList';
import CreateTaskForm from '../components/CreateTaskForm';

const AcademicPage: React.FC = () => {
  const {
    canvasConnection,
    taskStatistics,
    stressLevel,
    upcomingTasks,
    fetchTaskStatistics,
    fetchStressLevel,
    fetchUpcomingTasks
  } = useAcademicStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'canvas'>('overview');

  useEffect(() => {
    fetchTaskStatistics();
    fetchStressLevel();
    fetchUpcomingTasks();
  }, [fetchTaskStatistics, fetchStressLevel, fetchUpcomingTasks]);

  const getStressColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Academic Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your assignments, sync with Canvas, and track your academic stress level.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'canvas', label: 'Canvas Integration' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Academic Stress Level */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Academic Stress</h3>
              {stressLevel ? (
                <>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStressColor(stressLevel.level)}`}>
                    {stressLevel.level.toUpperCase()}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {stressLevel.score.toFixed(1)}/10
                  </p>
                </>
              ) : (
                <p className="text-gray-500">Loading...</p>
              )}
            </div>

            {/* Total Tasks */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Total Tasks</h3>
              <p className="text-2xl font-bold text-gray-900">
                {taskStatistics?.total || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {taskStatistics?.pending || 0} pending
              </p>
            </div>

            {/* Due Today */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Due Today</h3>
              <p className="text-2xl font-bold text-gray-900">
                {taskStatistics?.dueToday || 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {taskStatistics?.overdue || 0} overdue
              </p>
            </div>

            {/* Completion Rate */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Completion Rate</h3>
              <p className="text-2xl font-bold text-gray-900">
                {taskStatistics?.completionRate.toFixed(0) || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {taskStatistics?.completed || 0} completed
              </p>
            </div>
          </div>

          {/* Canvas Connection Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Canvas Integration</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {canvasConnection?.isConnected ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">Connection Status</h3>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm text-green-600 font-medium">Connected</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Connected as</p>
                        <p className="text-sm font-medium text-gray-900">{canvasConnection.canvasUserName}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      <p>Last sync: {canvasConnection.lastSyncedAt?.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('canvas')}
                      className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200"
                    >
                      Manage Connection
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Connect Canvas LMS</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Sync assignments and stay on top of your coursework
                    </p>
                    <button
                      onClick={() => setActiveTab('canvas')}
                      className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Connect Now
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Tasks</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                {upcomingTasks.length > 0 ? (
                  <TaskList compact={true} limit={5} showFilters={false} />
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">All Tasks</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Task</h3>
              <CreateTaskForm
                onSuccess={() => setShowCreateForm(false)}
                onCancel={() => setShowCreateForm(false)}
              />
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <TaskList />
          </div>
        </div>
      )}

      {/* Canvas Tab */}
      {activeTab === 'canvas' && (
        <div>
          <CanvasConnection />
        </div>
      )}
      </div>
    </Layout>
  );
};

export default AcademicPage;