// Minimal Sleep Service for Soulence
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3006;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'soulence',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'sleep-service', timestamp: new Date().toISOString() });
});

// Convert snake_case to camelCase for frontend
function convertRowToCamelCase(row) {
  return {
    id: row.id,
    userId: row.user_id,
    sessionDate: row.session_date,
    bedtime: row.bedtime,
    wakeTime: row.wake_time,
    totalSleepDuration: row.total_sleep_duration,
    sleepEfficiency: row.sleep_efficiency,
    qualityScore: row.quality_score,
    energyLevel: row.energy_level,
    moodUponWaking: row.mood_upon_waking,
    stressLevelBeforeBed: row.stress_level_before_bed,
    caffeineAfter2pm: row.caffeine_after_2pm,
    alcoholConsumed: row.alcohol_consumed,
    exerciseDay: row.exercise_day,
    screenTimeBeforeBed: row.screen_time_before_bed,
    roomTemperature: row.room_temperature,
    dataSource: row.data_source,
    confidenceScore: row.confidence_score,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Get all sleep sessions
app.get('/api/v1/sleep/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM sleep_sessions 
      WHERE user_id = $1 
      ORDER BY session_date DESC 
      LIMIT $2
    `, ['demo-user-id', req.query.limit || 20]);

    // Convert to camelCase for frontend
    const sessions = result.rows.map(convertRowToCamelCase);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        total: sessions.length,
        page: 1,
        limit: req.query.limit || 20,
        totalPages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sleep sessions'
    });
  }
});

// Create sleep session
app.post('/api/v1/sleep/sessions', async (req, res) => {
  try {
    const {
      sessionDate, bedtime, wakeTime, totalSleepDuration,
      sleepEfficiency, qualityScore, energyLevel, moodUponWaking,
      stressLevelBeforeBed, caffeineAfter2pm, alcoholConsumed,
      exerciseDay, screenTimeBeforeBed, roomTemperature, notes,
      dataSource, confidenceScore
    } = req.body;

    const result = await pool.query(`
      INSERT INTO sleep_sessions (
        user_id, session_date, bedtime, wake_time, total_sleep_duration,
        sleep_efficiency, quality_score, energy_level, mood_upon_waking,
        stress_level_before_bed, caffeine_after_2pm, alcohol_consumed,
        exercise_day, screen_time_before_bed, room_temperature, notes,
        data_source, confidence_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      'demo-user-id', sessionDate, bedtime, wakeTime, totalSleepDuration,
      sleepEfficiency, qualityScore, energyLevel, moodUponWaking,
      stressLevelBeforeBed, caffeineAfter2pm, alcoholConsumed,
      exerciseDay, screenTimeBeforeBed, roomTemperature, notes,
      dataSource, confidenceScore
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sleep session'
    });
  }
});

// Get today's session
app.get('/api/v1/sleep/sessions/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await pool.query(`
      SELECT * FROM sleep_sessions 
      WHERE user_id = $1 AND session_date = $2
    `, ['demo-user-id', today]);

    const session = result.rows[0] ? convertRowToCamelCase(result.rows[0]) : null;

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Error fetching today session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today session'
    });
  }
});

// Get analytics
app.get('/api/v1/sleep/analytics', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        averageSleepDuration: 420,
        averageQualityScore: 7.2,
        averageEfficiency: 85,
        averageEnergyLevel: 7.5
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// Get insights
app.get('/api/v1/sleep/insights', async (req, res) => {
  res.json({ success: true, data: [] });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Sleep Service running on port ${port}`);
  console.log('Health check: http://localhost:3006/health');
});