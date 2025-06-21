// Service Simulator - Demonstrates microservice interactions
console.log('🚀 Soulence Microservices Simulator\n');

// Simulated databases
const databases = {
  postgres: {
    users: new Map(),
    mood_logs: [],
    crisis_alerts: []
  },
  redis: new Map()
};

// Simulated Auth Service (Port 3001)
class AuthService {
  constructor() {
    this.port = 3001;
    console.log(`✅ Auth Service started on port ${this.port}`);
  }

  async register(email, password, role) {
    console.log(`\n📝 [Auth Service] Processing registration for ${email}`);
    
    // Check if user exists
    if (databases.postgres.users.has(email)) {
      throw new Error('User already exists');
    }
    
    // Create user
    const user = {
      id: `user_${Date.now()}`,
      email,
      passwordHash: `hash_${password}`, // In reality, this would be bcrypt
      role,
      createdAt: new Date(),
      isVerified: false
    };
    
    databases.postgres.users.set(email, user);
    console.log(`✅ [Auth Service] User created with ID: ${user.id}`);
    
    // Generate JWT token
    const token = this.generateToken(user);
    console.log(`🔑 [Auth Service] JWT token generated`);
    
    return { user, token };
  }

  async login(email, password) {
    console.log(`\n🔐 [Auth Service] Processing login for ${email}`);
    
    const user = databases.postgres.users.get(email);
    if (!user || user.passwordHash !== `hash_${password}`) {
      throw new Error('Invalid credentials');
    }
    
    const token = this.generateToken(user);
    console.log(`✅ [Auth Service] Login successful`);
    
    return { user, token };
  }

  generateToken(user) {
    // Simulated JWT
    return Buffer.from(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + 86400000 // 24 hours
    })).toString('base64');
  }

  verifyToken(token) {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (payload.exp < Date.now()) {
        throw new Error('Token expired');
      }
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

// Simulated Wellness Service (Port 3002)
class WellnessService {
  constructor(authService) {
    this.port = 3002;
    this.authService = authService;
    console.log(`✅ Wellness Service started on port ${this.port}`);
  }

  async logMood(token, moodData) {
    console.log(`\n😊 [Wellness Service] Processing mood log`);
    
    // Verify token
    const user = this.authService.verifyToken(token);
    console.log(`✅ [Wellness Service] Token verified for user ${user.email}`);
    
    // Create mood log
    const moodLog = {
      id: `mood_${Date.now()}`,
      userId: user.sub,
      moodScore: moodData.moodScore,
      emotions: moodData.emotions,
      notes: moodData.notes,
      loggedAt: new Date()
    };
    
    databases.postgres.mood_logs.push(moodLog);
    console.log(`💾 [Wellness Service] Mood saved to PostgreSQL`);
    
    // Cache today's mood
    const cacheKey = `mood:today:${user.sub}`;
    databases.redis.set(cacheKey, JSON.stringify(moodLog));
    console.log(`⚡ [Wellness Service] Today's mood cached in Redis`);
    
    // Check for crisis
    if (moodData.moodScore <= 3) {
      await this.triggerCrisisProtocol(user.sub, moodLog);
    }
    
    return moodLog;
  }

  async triggerCrisisProtocol(userId, moodLog) {
    console.log(`\n🚨 [Wellness Service] CRISIS DETECTED! Mood score: ${moodLog.moodScore}`);
    
    const alert = {
      id: `crisis_${Date.now()}`,
      userId,
      severityLevel: moodLog.moodScore,
      triggerPattern: `Low mood score: ${moodLog.moodScore}`,
      createdAt: new Date()
    };
    
    databases.postgres.crisis_alerts.push(alert);
    console.log(`📢 [Wellness Service] Crisis alert created`);
    console.log(`📧 [Wellness Service] Notifying therapist...`);
    console.log(`💬 [Wellness Service] Sending support message to user...`);
  }

  async getMoodHistory(token) {
    console.log(`\n📊 [Wellness Service] Retrieving mood history`);
    
    const user = this.authService.verifyToken(token);
    const userMoods = databases.postgres.mood_logs.filter(log => log.userId === user.sub);
    
    // Calculate stats
    const stats = {
      totalLogs: userMoods.length,
      averageScore: userMoods.length > 0 
        ? userMoods.reduce((sum, log) => sum + log.moodScore, 0) / userMoods.length 
        : 0,
      trend: 'stable' // Simplified
    };
    
    console.log(`✅ [Wellness Service] Found ${userMoods.length} mood logs`);
    return { moodLogs: userMoods, stats };
  }
}

// Run simulation
async function runSimulation() {
  console.log('\n=== Starting Microservices Simulation ===\n');
  
  // Start services
  const authService = new AuthService();
  const wellnessService = new WellnessService(authService);
  
  try {
    // 1. Register a student
    console.log('\n--- Step 1: User Registration ---');
    const { user, token } = await authService.register(
      'alex@student.com',
      'SecurePass123',
      'student'
    );
    
    // 2. Log a normal mood
    console.log('\n--- Step 2: Log Normal Mood ---');
    await wellnessService.logMood(token, {
      moodScore: 8,
      emotions: ['happy', 'motivated'],
      notes: 'Great day at school!'
    });
    
    // 3. Log a concerning mood
    console.log('\n--- Step 3: Log Low Mood (Crisis) ---');
    await wellnessService.logMood(token, {
      moodScore: 2,
      emotions: ['sad', 'anxious', 'overwhelmed'],
      notes: 'Everything feels too much'
    });
    
    // 4. Check mood history
    console.log('\n--- Step 4: Check Mood History ---');
    const history = await wellnessService.getMoodHistory(token);
    console.log(`📈 Average mood score: ${history.stats.averageScore.toFixed(1)}`);
    
    // 5. Show system state
    console.log('\n--- System State ---');
    console.log(`👥 Total users: ${databases.postgres.users.size}`);
    console.log(`😊 Total mood logs: ${databases.postgres.mood_logs.length}`);
    console.log(`🚨 Total crisis alerts: ${databases.postgres.crisis_alerts.length}`);
    console.log(`⚡ Redis cache entries: ${databases.redis.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n=== Simulation Complete ===\n');
}

// Show what would happen with real HTTP requests
function showRealAPIFlow() {
  console.log('\n📚 How This Would Work with Real HTTP Requests:\n');
  
  console.log('1. Frontend makes request:');
  console.log('   POST http://localhost:3001/api/v1/auth/register');
  console.log('   Body: {email, password, role}\n');
  
  console.log('2. Auth Service processes and returns:');
  console.log('   {data: {user: {...}, accessToken: "..."}}\n');
  
  console.log('3. Frontend stores token and uses for next request:');
  console.log('   POST http://localhost:3002/api/v1/mood');
  console.log('   Headers: {Authorization: "Bearer <token>"}');
  console.log('   Body: {moodScore: 8, emotions: [...]}\n');
  
  console.log('4. Wellness Service validates token internally');
  console.log('5. Saves mood and checks for crisis');
  console.log('6. Returns confirmation to frontend\n');
}

// Run everything
runSimulation().then(() => {
  showRealAPIFlow();
});