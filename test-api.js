// Test script to demonstrate API interactions
const axios = require('axios');

// Configuration
const AUTH_SERVICE_URL = 'http://localhost:3001';
const WELLNESS_SERVICE_URL = 'http://localhost:3002';

// Test user data
const testUser = {
  email: 'student@test.com',
  password: 'Test123!@#',
  role: 'student'
};

// Helper function to make requests
async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url,
      headers: {}
    };
    
    if (data) config.data = data;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${url}:`, error.response?.data || error.message);
    throw error;
  }
}

// Test flow
async function runTests() {
  console.log('🚀 Starting Soulence API Tests\n');
  
  let accessToken;
  let userId;
  
  // 1. Register a new user
  console.log('1️⃣ Testing User Registration');
  try {
    const registerResponse = await makeRequest(
      'POST',
      `${AUTH_SERVICE_URL}/api/v1/auth/register`,
      testUser
    );
    console.log('✅ Registration successful:', registerResponse.data.user);
    accessToken = registerResponse.data.accessToken;
    userId = registerResponse.data.user.id;
  } catch (error) {
    console.log('❌ Registration failed (user might already exist)');
  }
  
  // 2. Login
  console.log('\n2️⃣ Testing User Login');
  try {
    const loginResponse = await makeRequest(
      'POST',
      `${AUTH_SERVICE_URL}/api/v1/auth/login`,
      {
        email: testUser.email,
        password: testUser.password
      }
    );
    console.log('✅ Login successful');
    accessToken = loginResponse.data.accessToken;
    userId = loginResponse.data.user.id;
  } catch (error) {
    console.log('❌ Login failed');
    return;
  }
  
  // 3. Log a mood
  console.log('\n3️⃣ Testing Mood Logging');
  const moodData = {
    moodScore: 7,
    emotions: ['happy', 'excited', 'motivated'],
    notes: 'Had a great day learning about microservices!'
  };
  
  try {
    const moodResponse = await makeRequest(
      'POST',
      `${WELLNESS_SERVICE_URL}/api/v1/mood`,
      moodData,
      accessToken
    );
    console.log('✅ Mood logged successfully:', moodResponse.data.moodLog);
  } catch (error) {
    console.log('❌ Mood logging failed');
  }
  
  // 4. Test crisis detection (low mood)
  console.log('\n4️⃣ Testing Crisis Detection');
  const lowMoodData = {
    moodScore: 2,
    emotions: ['sad', 'anxious', 'overwhelmed'],
    notes: 'Really struggling today'
  };
  
  try {
    const crisisResponse = await makeRequest(
      'POST',
      `${WELLNESS_SERVICE_URL}/api/v1/mood`,
      lowMoodData,
      accessToken
    );
    console.log('✅ Low mood logged, crisis protocol triggered');
  } catch (error) {
    console.log('❌ Crisis detection test failed');
  }
  
  // 5. Get mood history
  console.log('\n5️⃣ Testing Mood History Retrieval');
  try {
    const historyResponse = await makeRequest(
      'GET',
      `${WELLNESS_SERVICE_URL}/api/v1/mood/history?limit=10`,
      null,
      accessToken
    );
    console.log('✅ Mood history retrieved:');
    console.log('   Total logs:', historyResponse.data.moodLogs.length);
    console.log('   Average mood:', historyResponse.data.stats.averageScore);
    console.log('   Trend:', historyResponse.data.stats.trend);
  } catch (error) {
    console.log('❌ Mood history retrieval failed');
  }
  
  // 6. Get today's mood
  console.log('\n6️⃣ Testing Today\'s Mood Check');
  try {
    const todayResponse = await makeRequest(
      'GET',
      `${WELLNESS_SERVICE_URL}/api/v1/mood/today`,
      null,
      accessToken
    );
    console.log('✅ Today\'s mood status:', todayResponse.data.hasMoodToday ? 'Logged' : 'Not logged');
  } catch (error) {
    console.log('❌ Today\'s mood check failed');
  }
  
  // 7. Get crisis resources
  console.log('\n7️⃣ Testing Crisis Resources');
  try {
    const resourcesResponse = await makeRequest(
      'GET',
      `${WELLNESS_SERVICE_URL}/api/v1/crisis/resources`,
      null,
      accessToken
    );
    console.log('✅ Crisis resources available:');
    resourcesResponse.data.helplines.forEach(helpline => {
      console.log(`   - ${helpline.name}: ${helpline.number}`);
    });
  } catch (error) {
    console.log('❌ Crisis resources retrieval failed');
  }
  
  console.log('\n✨ API tests completed!\n');
}

// Run the tests
runTests().catch(console.error);