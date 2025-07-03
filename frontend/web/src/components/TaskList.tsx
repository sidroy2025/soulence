import React, { useState, useEffect } from 'react';
import { useAcademicStore } from '../stores/academicStore';
import { Task, TaskFilters } from '../types/academic';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface TaskListProps {
  showFilters?: boolean;
  compact?: boolean;
  limit?: number;
}

const TaskList: React.FC<TaskListProps> = ({ 
  showFilters = true, 
  compact = false, 
  limit 
}) => {
  const { 
    tasks, 
    isLoadingTasks, 
    error, 
    fetchTasks, 
    updateTask, 
    deleteTask 
  } = useAcademicStore();

  const [filters, setFilters] = useState<TaskFilters>({});
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    fetchTasks(filters);
  }, [filters, fetchTasks]);

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    try {
      await updateTask(taskId, { status });
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const getPriorityConfig = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': 
        return {
          color: 'text-red-700 bg-red-50 border-red-200',
          icon: '🔥',
          label: 'High'
        };
      case 'medium': 
        return {
          color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
          icon: '⚠️',
          label: 'Medium'
        };
      case 'low': 
        return {
          color: 'text-green-700 bg-green-50 border-green-200',
          icon: '✅',
          label: 'Low'
        };
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDueDate = (dueDate: Date) => {
    if (isToday(dueDate)) return 'Today';
    if (isTomorrow(dueDate)) return 'Tomorrow';
    if (isPast(dueDate)) return `Overdue (${format(dueDate, 'MMM d')})`;
    return format(dueDate, 'MMM d, yyyy');
  };

  const filteredTasks = tasks
    .filter(task => showCompleted || task.status !== 'completed')
    .slice(0, limit);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading tasks: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.priority || ''}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.isFromCanvas?.toString() || ''}
            onChange={(e) => setFilters({ 
              ...filters, 
              isFromCanvas: e.target.value ? e.target.value === 'true' : undefined 
            })}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Sources</option>
            <option value="true">Canvas</option>
            <option value="false">Manual</option>
          </select>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Show completed</span>
          </label>
        </div>
      )}

      {isLoadingTasks ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-4">
            {showCompleted ? "Try adjusting your filters" : "Get started by creating your first task"}
          </p>
          {!showCompleted && !compact && (
            <button
              onClick={() => window.location.hash = '#new-task'}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Task
            </button>
          )}
        </div>
      ) : (
        <div className={`space-y-${compact ? '2' : '3'}`}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`border rounded-lg p-${compact ? '3' : '4'} hover:shadow-lg hover:border-gray-300 transition-all duration-200 transform hover:-translate-y-0.5 ${
                task.status === 'completed' ? 'bg-gray-50 opacity-75' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      checked={task.status === 'completed'}
                      onChange={(e) => 
                        handleStatusChange(
                          task.id, 
                          e.target.checked ? 'completed' : 'pending'
                        )
                      }
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    />
                    <h3 className={`font-medium transition-all duration-300 ${
                      task.status === 'completed' 
                        ? 'line-through text-gray-500' 
                        : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h3>
                    
                    {task.isFromCanvas && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Canvas
                      </span>
                    )}
                  </div>

                  {task.description && !compact && (
                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                  )}

                  <div className="flex items-center space-x-3 text-sm">
                    {(() => {
                      const priorityConfig = getPriorityConfig(task.priority);
                      const isOverdue = task.dueDate && isPast(task.dueDate) && task.status !== 'completed';
                      return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${priorityConfig.color} min-h-[24px] ${
                          task.priority === 'high' && isOverdue ? 'animate-pulse' : ''
                        }`}>
                          <span className="mr-1">{priorityConfig.icon}</span>
                          {priorityConfig.label}
                        </span>
                      );
                    })()}

                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>

                    {task.dueDate && (
                      <span className={`text-xs ${
                        isPast(task.dueDate) && task.status !== 'completed' 
                          ? 'text-red-600 font-medium' 
                          : 'text-gray-500'
                      }`}>
                        Due: {formatDueDate(task.dueDate)}
                      </span>
                    )}

                    {task.estimatedMinutes && (
                      <span className="text-xs text-gray-500">
                        ~{task.estimatedMinutes} min
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {!task.isFromCanvas && (
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      title="Delete task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;