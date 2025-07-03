// Mock API service for demo purposes
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth';
import { MoodLog, MoodStats, LogMoodRequest, CrisisResources } from '../types/wellness';
import { 
  Task, 
  CanvasConnection, 
  TaskStatistics, 
  StressLevel, 
  CreateTaskRequest,
  UpdateTaskRequest 
} from '../types/academic';

// Simulated delay to mimic real API
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage
let mockUsers: User[] = [];
let mockMoodLogs: MoodLog[] = [];
let mockTasks: Task[] = [];
let mockCanvasConnection: CanvasConnection | null = null;
let currentUser: User | null = null;

export const mockApiService = {
  // Auth endpoints
  async register(data: RegisterRequest): Promise<AuthResponse> {
    await delay(1000);
    
    // Check if user exists
    if (mockUsers.find(u => u.email === data.email)) {
      throw new Error('User already exists');
    }
    
    // Create new user
    const user: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      role: data.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: true
    };
    
    mockUsers.push(user);
    currentUser = user;
    
    const accessToken = `mock_token_${user.id}`;
    const refreshToken = `mock_refresh_${user.id}`;
    
    return {
      status: 'success',
      data: {
        user,
        accessToken,
        refreshToken
      }
    };
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    await delay(800);
    
    const user = mockUsers.find(u => u.email === data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    currentUser = user;
    user.lastLogin = new Date().toISOString();
    
    const accessToken = `mock_token_${user.id}`;
    const refreshToken = `mock_refresh_${user.id}`;
    
    return {
      status: 'success',
      data: {
        user,
        accessToken,
        refreshToken
      }
    };
  },

  async getCurrentUser(): Promise<User> {
    await delay(300);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    return currentUser;
  },

  // Wellness endpoints
  async logMood(data: LogMoodRequest): Promise<{ moodLog: MoodLog }> {
    await delay(600);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const moodLog: MoodLog = {
      id: `mood_${Date.now()}`,
      userId: currentUser.id,
      moodScore: data.moodScore,
      emotions: data.emotions || [],
      notes: data.notes,
      loggedAt: new Date().toISOString()
    };
    
    mockMoodLogs.push(moodLog);
    
    // Simulate crisis detection
    if (data.moodScore <= 3) {
      console.log('🚨 Crisis detected - showing support resources');
      // In a real app, this would trigger notifications
    }
    
    return { moodLog };
  },

  async getMoodHistory(): Promise<{ moodLogs: MoodLog[]; stats: MoodStats }> {
    await delay(400);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const userMoods = mockMoodLogs
      .filter(log => log.userId === currentUser!.id)
      .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());
    
    // Calculate stats
    const scores = userMoods.map(log => log.moodScore);
    const stats: MoodStats = {
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      totalLogs: userMoods.length,
      consecutiveDays: Math.min(userMoods.length, 7), // Simplified
      trend: scores.length >= 2 ? 
        (scores[0] > scores[scores.length - 1] ? 'improving' : 
         scores[0] < scores[scores.length - 1] ? 'declining' : 'stable') : 'stable'
    };
    
    return { moodLogs: userMoods, stats };
  },

  async getTodayMood(): Promise<{ hasMoodToday: boolean; mood?: MoodLog }> {
    await delay(200);
    
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    
    const today = new Date().toDateString();
    const todayMood = mockMoodLogs
      .filter(log => log.userId === currentUser!.id)
      .find(log => new Date(log.loggedAt).toDateString() === today);
    
    return {
      hasMoodToday: !!todayMood,
      mood: todayMood
    };
  },

  async getCrisisResources(): Promise<CrisisResources> {
    await delay(300);
    
    return {
      helplines: [
        {
          name: "National Suicide Prevention Lifeline",
          number: "988",
          available: "24/7",
          description: "Free and confidential emotional support"
        },
        {
          name: "Crisis Text Line",
          number: "Text HOME to 741741",
          available: "24/7",
          description: "Free, 24/7 crisis support via text"
        },
        {
          name: "SAMHSA National Helpline",
          number: "1-800-662-4357",
          available: "24/7",
          description: "Treatment referral and information service"
        }
      ],
      tips: [
        "Take slow, deep breaths (4 counts in, 4 counts hold, 4 counts out)",
        "Ground yourself: name 5 things you can see, 4 you can hear, 3 you can touch",
        "Reach out to a trusted friend, family member, or counselor",
        "Try progressive muscle relaxation",
        "Listen to calming music or nature sounds"
      ],
      emergencyMessage: "If you're in immediate danger, please call 911 or go to your nearest emergency room."
    };
  },

  // Academic endpoints
  async getCanvasConnectionStatus(): Promise<CanvasConnection> {
    await delay(300);
    return mockCanvasConnection || { isConnected: false };
  },

  async initiateCanvasOAuth(): Promise<{ authUrl: string; state: string }> {
    await delay(500);
    const state = `state_${Date.now()}`;
    return {
      authUrl: `https://demo-canvas.instructure.com/login/oauth2/auth?state=${state}`,
      state
    };
  },

  async disconnectCanvas(): Promise<void> {
    await delay(500);
    mockCanvasConnection = { isConnected: false };
    // Clear Canvas tasks
    mockTasks = mockTasks.filter(task => !task.isFromCanvas);
  },

  async syncCanvasData(): Promise<void> {
    await delay(2000);
    mockCanvasConnection = {
      isConnected: true,
      canvasUserName: "Demo Student",
      canvasUserEmail: "demo@student.edu",
      connectedAt: new Date(),
      lastSyncedAt: new Date()
    };
  },

  async getTasks(filters?: any): Promise<Task[]> {
    await delay(400);
    let filteredTasks = [...mockTasks];
    
    if (filters?.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    if (filters?.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters?.isFromCanvas !== undefined) {
      filteredTasks = filteredTasks.filter(task => task.isFromCanvas === filters.isFromCanvas);
    }
    
    return filteredTasks;
  },

  async createTask(taskData: CreateTaskRequest): Promise<Task> {
    await delay(600);
    
    const newTask: Task = {
      id: `task_${Date.now()}`,
      userId: currentUser?.id || 'demo_user_123',
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      priority: taskData.priority || 'medium',
      status: 'pending',
      isFromCanvas: false,
      estimatedMinutes: taskData.estimatedMinutes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockTasks.push(newTask);
    return newTask;
  },

  async updateTask(taskId: string, updates: UpdateTaskRequest): Promise<Task> {
    await delay(500);
    
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const task = mockTasks[taskIndex];
    if (task.isFromCanvas) {
      throw new Error('Cannot update Canvas-synced tasks');
    }
    
    const updatedTask = {
      ...task,
      ...updates,
      updatedAt: new Date(),
      completedAt: updates.status === 'completed' ? new Date() : task.completedAt
    };
    
    mockTasks[taskIndex] = updatedTask;
    return updatedTask;
  },

  async deleteTask(taskId: string): Promise<void> {
    await delay(400);
    
    const taskIndex = mockTasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }
    
    const task = mockTasks[taskIndex];
    if (task.isFromCanvas) {
      throw new Error('Cannot delete Canvas-synced tasks');
    }
    
    mockTasks.splice(taskIndex, 1);
  },

  async getUpcomingTasks(days: number = 7): Promise<Task[]> {
    await delay(300);
    
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return mockTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) <= futureDate && 
      new Date(task.dueDate) >= now &&
      task.status !== 'completed'
    );
  },

  async getTaskStatistics(): Promise<TaskStatistics> {
    await delay(300);
    
    const total = mockTasks.length;
    const pending = mockTasks.filter(task => task.status === 'pending').length;
    const inProgress = mockTasks.filter(task => task.status === 'in_progress').length;
    const completed = mockTasks.filter(task => task.status === 'completed').length;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const overdue = mockTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < today && 
      task.status !== 'completed'
    ).length;
    
    const dueToday = mockTasks.filter(task =>
      task.dueDate &&
      new Date(task.dueDate) >= today &&
      new Date(task.dueDate) < tomorrow &&
      task.status !== 'completed'
    ).length;
    
    const dueThisWeek = mockTasks.filter(task =>
      task.dueDate &&
      new Date(task.dueDate) >= today &&
      new Date(task.dueDate) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) &&
      task.status !== 'completed'
    ).length;
    
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    
    return {
      total,
      pending,
      inProgress,
      completed,
      overdue,
      dueToday,
      dueThisWeek,
      completionRate
    };
  },

  async getStressLevel(): Promise<StressLevel> {
    await delay(400);
    
    // Calculate mock stress based on tasks
    const overdueCount = mockTasks.filter(task =>
      task.dueDate &&
      new Date(task.dueDate) < new Date() &&
      task.status !== 'completed'
    ).length;
    
    const urgentCount = mockTasks.filter(task =>
      task.dueDate &&
      new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) &&
      task.status !== 'completed'
    ).length;
    
    const score = (overdueCount * 2) + (urgentCount * 1.5);
    let level: 'low' | 'medium' | 'high' = 'low';
    
    if (score >= 8) level = 'high';
    else if (score >= 4) level = 'medium';
    
    return {
      level,
      score,
      lastCalculated: new Date(),
      indicators: [
        { type: 'overdue_assignments', value: overdueCount, weight: 2.0 },
        { type: 'urgent_assignments', value: urgentCount, weight: 1.5 }
      ]
    };
  }
};

// Pre-populate with demo data
export const initializeDemoData = () => {
  // Create a demo user
  const demoUser: User = {
    id: 'demo_user_123',
    email: 'demo@student.com',
    role: 'student' as any,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    updatedAt: new Date().toISOString(),
    isVerified: true,
    lastLogin: new Date().toISOString()
  };
  
  mockUsers.push(demoUser);
  
  // Create some demo mood logs
  const demoMoods: MoodLog[] = [
    {
      id: 'mood_1',
      userId: demoUser.id,
      moodScore: 8,
      emotions: ['happy', 'motivated'],
      notes: 'Great day at school! Aced my presentation.',
      loggedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mood_2',
      userId: demoUser.id,
      moodScore: 6,
      emotions: ['content', 'calm'],
      notes: 'Regular day, feeling okay.',
      loggedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mood_3',
      userId: demoUser.id,
      moodScore: 4,
      emotions: ['stressed', 'overwhelmed'],
      notes: 'Lots of homework and feeling behind.',
      loggedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mood_4',
      userId: demoUser.id,
      moodScore: 7,
      emotions: ['relieved', 'hopeful'],
      notes: 'Finished my big project. Feeling much better.',
      loggedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'mood_5',
      userId: demoUser.id,
      moodScore: 5,
      emotions: ['neutral'],
      notes: 'Just an average day.',
      loggedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  
  mockMoodLogs.push(...demoMoods);
  
  // Create demo tasks
  const demoTasks: Task[] = [
    {
      id: 'task_1',
      userId: demoUser.id,
      title: 'Math Assignment - Chapter 12',
      description: 'Complete problems 1-25 on quadratic equations',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      priority: 'high',
      status: 'pending',
      isFromCanvas: true,
      assignmentId: 'canvas_assignment_1',
      estimatedMinutes: 90,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'task_2',
      userId: demoUser.id,
      title: 'History Essay - World War II',
      description: 'Write a 5-page essay on the causes of WWII',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      priority: 'medium',
      status: 'pending',
      isFromCanvas: true,
      assignmentId: 'canvas_assignment_2',
      estimatedMinutes: 180,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'task_3',
      userId: demoUser.id,
      title: 'Study for Chemistry Quiz',
      description: 'Review chapters 8-10 for the quiz on Friday',
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
      priority: 'high',
      status: 'in_progress',
      isFromCanvas: false,
      estimatedMinutes: 120,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'task_4',
      userId: demoUser.id,
      title: 'Biology Lab Report',
      description: 'Complete lab report on photosynthesis experiment',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      priority: 'medium',
      status: 'pending',
      isFromCanvas: true,
      assignmentId: 'canvas_assignment_3',
      estimatedMinutes: 150,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'task_5',
      userId: demoUser.id,
      title: 'English Reading Assignment',
      description: 'Read chapters 15-18 of "To Kill a Mockingbird"',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Yesterday (overdue)
      priority: 'low',
      status: 'pending',
      isFromCanvas: true,
      assignmentId: 'canvas_assignment_4',
      estimatedMinutes: 60,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'task_6',
      userId: demoUser.id,
      title: 'Call Academic Advisor',
      description: 'Schedule meeting to discuss course selection for next semester',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      priority: 'low',
      status: 'pending',
      isFromCanvas: false,
      estimatedMinutes: 30,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];
  
  mockTasks.push(...demoTasks);
  
  // Set up mock Canvas connection
  mockCanvasConnection = {
    isConnected: true,
    canvasUserName: "Demo Student",
    canvasUserEmail: "demo@student.edu",
    connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Connected 7 days ago
    lastSyncedAt: new Date(Date.now() - 15 * 60 * 1000) // Last synced 15 minutes ago
  };
  
  console.log('🎭 Demo data initialized with sample user, mood logs, and academic tasks');
};