-- Sleep Service Database Schema
-- Soulence Phase 2B: Sleep Monitoring Integration
-- Creates 3 core tables for comprehensive sleep tracking and analysis

-- ============================================================================
-- 1. SLEEP SESSIONS TABLE
-- Core sleep data with manual and automated tracking support
-- ============================================================================

CREATE TABLE sleep_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    
    -- Sleep timing data
    bedtime TIMESTAMP WITH TIME ZONE,
    sleep_onset TIMESTAMP WITH TIME ZONE, -- When actually fell asleep
    wake_time TIMESTAMP WITH TIME ZONE,
    get_up_time TIMESTAMP WITH TIME ZONE, -- When actually got out of bed
    
    -- Calculated metrics
    total_sleep_duration INTEGER, -- Total sleep in minutes
    sleep_latency INTEGER, -- Time to fall asleep in minutes
    sleep_efficiency DECIMAL(5,2), -- Percentage (total sleep / time in bed * 100)
    wake_episodes INTEGER DEFAULT 0, -- Number of times woke up during night
    
    -- Quality and subjective measures
    quality_score DECIMAL(3,1) CHECK (quality_score >= 1 AND quality_score <= 10), -- 1-10 user rating
    energy_level DECIMAL(3,1) CHECK (energy_level >= 1 AND energy_level <= 10), -- How energetic user felt upon waking
    mood_upon_waking VARCHAR(50), -- happy, groggy, refreshed, tired, etc.
    
    -- Environmental and behavioral factors
    caffeine_after_2pm BOOLEAN DEFAULT FALSE,
    alcohol_consumed BOOLEAN DEFAULT FALSE,
    exercise_day BOOLEAN DEFAULT FALSE,
    screen_time_before_bed INTEGER, -- Minutes of screen time 1 hour before bed
    room_temperature VARCHAR(20), -- cold, cool, comfortable, warm, hot
    
    -- Data source and reliability
    data_source VARCHAR(50) NOT NULL DEFAULT 'manual', -- manual, nest_hub, digital_wellbeing, estimated, wearable
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- How confident we are in this data (0-1)
    
    -- Notes and context
    notes TEXT,
    stress_level_before_bed DECIMAL(3,1) CHECK (stress_level_before_bed >= 1 AND stress_level_before_bed <= 10),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, session_date),
    CHECK (wake_time > bedtime OR wake_time IS NULL),
    CHECK (sleep_onset >= bedtime OR sleep_onset IS NULL),
    CHECK (get_up_time >= wake_time OR get_up_time IS NULL)
);

-- Indexes for performance
CREATE INDEX idx_sleep_sessions_user_date ON sleep_sessions(user_id, session_date DESC);
CREATE INDEX idx_sleep_sessions_created_at ON sleep_sessions(created_at DESC);
CREATE INDEX idx_sleep_sessions_quality ON sleep_sessions(user_id, quality_score);

-- ============================================================================
-- 2. SLEEP PATTERNS TABLE
-- Detected patterns and trends in user's sleep behavior
-- ============================================================================

CREATE TABLE sleep_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Pattern identification
    pattern_type VARCHAR(50) NOT NULL, -- normal, delayed_phase, advanced_phase, irregular, fragmented, insufficient, excessive
    pattern_subtype VARCHAR(50), -- mild, moderate, severe for classification
    
    -- Detection details
    detection_date DATE NOT NULL,
    analysis_period_start DATE NOT NULL, -- Start of data period used for detection
    analysis_period_end DATE NOT NULL, -- End of data period used for detection
    confidence_score DECIMAL(4,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0-1 confidence in detection
    
    -- Pattern-specific data stored as JSON for flexibility
    pattern_data JSONB NOT NULL, -- Specific metrics for each pattern type
    
    -- Pattern severity and impact
    severity_level VARCHAR(20) NOT NULL DEFAULT 'mild', -- mild, moderate, severe
    impact_on_mood DECIMAL(4,2), -- Correlation coefficient (-1 to 1)
    impact_on_academic DECIMAL(4,2), -- Correlation coefficient (-1 to 1)
    
    -- Intervention tracking
    intervention_recommended BOOLEAN DEFAULT FALSE,
    intervention_triggered BOOLEAN DEFAULT FALSE,
    intervention_type VARCHAR(100), -- bedtime_reminder, sleep_hygiene_tips, schedule_adjustment, professional_referral
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'active', -- active, improving, resolved, worsening
    resolved_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sleep_patterns_user_type ON sleep_patterns(user_id, pattern_type);
CREATE INDEX idx_sleep_patterns_detection_date ON sleep_patterns(user_id, detection_date DESC);
CREATE INDEX idx_sleep_patterns_status ON sleep_patterns(user_id, status);

-- ============================================================================
-- 3. SLEEP CORRELATIONS TABLE
-- Correlations between sleep and other wellness metrics
-- ============================================================================

CREATE TABLE sleep_correlations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Correlation type and target
    correlation_type VARCHAR(50) NOT NULL, -- mood, academic_stress, task_completion, crisis_risk, energy_level
    target_metric VARCHAR(100) NOT NULL, -- specific metric being correlated (mood_score, stress_level, completion_rate, etc.)
    
    -- Statistical analysis
    correlation_coefficient DECIMAL(6,3) NOT NULL CHECK (correlation_coefficient >= -1 AND correlation_coefficient <= 1), -- Pearson correlation (-1 to 1)
    p_value DECIMAL(10,8), -- Statistical significance
    confidence_interval_lower DECIMAL(6,3),
    confidence_interval_upper DECIMAL(6,3),
    
    -- Data period and sample size
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    data_points_count INTEGER NOT NULL CHECK (data_points_count > 0),
    minimum_data_threshold_met BOOLEAN NOT NULL DEFAULT FALSE, -- Whether we have enough data for reliable correlation
    
    -- Correlation strength classification
    strength_category VARCHAR(20) NOT NULL, -- negligible, weak, moderate, strong, very_strong
    practical_significance BOOLEAN DEFAULT FALSE, -- Whether correlation is large enough to be practically meaningful
    
    -- Sleep-specific correlation data
    sleep_metric VARCHAR(50) NOT NULL, -- duration, quality, efficiency, onset_time, wake_time, etc.
    optimal_sleep_range JSONB, -- What sleep values correlate with best outcomes
    
    -- Insights and recommendations
    insights JSONB, -- Key insights about this correlation
    recommendations JSONB, -- Specific recommendations based on correlation
    
    -- Timestamps
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sleep_correlations_user_type ON sleep_correlations(user_id, correlation_type);
CREATE INDEX idx_sleep_correlations_calculated ON sleep_correlations(calculated_at DESC);
CREATE INDEX idx_sleep_correlations_strength ON sleep_correlations(user_id, strength_category);

-- ============================================================================
-- 4. SLEEP INTERVENTIONS TABLE
-- Track sleep improvement interventions and their effectiveness
-- ============================================================================

CREATE TABLE sleep_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Intervention details
    intervention_type VARCHAR(100) NOT NULL, -- bedtime_reminder, sleep_hygiene_education, schedule_adjustment, crisis_escalation
    trigger_type VARCHAR(100) NOT NULL, -- pattern_detection, correlation_analysis, manual_request, crisis_threshold
    trigger_data JSONB, -- Details about what triggered this intervention
    
    -- Intervention content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_items JSONB, -- Specific actions recommended to user
    resources JSONB, -- Links, articles, tools provided
    
    -- Targeting and personalization
    severity_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
    personalization_data JSONB, -- User-specific customizations
    
    -- Delivery and engagement
    delivery_method VARCHAR(50) NOT NULL, -- in_app, email, push_notification, sms
    delivered_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Effectiveness tracking
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5), -- How helpful user found intervention
    behavior_change_observed BOOLEAN,
    sleep_improvement_measured BOOLEAN,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, delivered, acknowledged, completed, dismissed, expired
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sleep_interventions_user_status ON sleep_interventions(user_id, status);
CREATE INDEX idx_sleep_interventions_created_at ON sleep_interventions(created_at DESC);
CREATE INDEX idx_sleep_interventions_type ON sleep_interventions(user_id, intervention_type);

-- ============================================================================
-- 5. SLEEP INSIGHTS TABLE
-- Generated insights and recommendations for users
-- ============================================================================

CREATE TABLE sleep_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Insight classification
    insight_type VARCHAR(50) NOT NULL, -- pattern_discovery, correlation_insight, improvement_opportunity, achievement, warning
    category VARCHAR(50) NOT NULL, -- duration, timing, quality, consistency, health_impact
    
    -- Insight content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    key_metrics JSONB, -- Specific metrics supporting this insight
    evidence_data JSONB, -- Data points and analysis supporting insight
    
    -- Actionability
    actionable BOOLEAN DEFAULT TRUE,
    recommendations JSONB, -- Specific actions user can take
    difficulty_level VARCHAR(20) DEFAULT 'moderate', -- easy, moderate, challenging
    expected_impact VARCHAR(20) DEFAULT 'moderate', -- low, moderate, high
    
    -- Personalization
    relevance_score DECIMAL(3,2) DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    priority_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    
    -- User interaction
    shown_to_user BOOLEAN DEFAULT FALSE,
    shown_at TIMESTAMP WITH TIME ZONE,
    dismissed_by_user BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    
    -- Validity and freshness
    valid_until DATE, -- When this insight should be recalculated
    data_period_start DATE NOT NULL,
    data_period_end DATE NOT NULL,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sleep_insights_user_shown ON sleep_insights(user_id, shown_to_user, priority_level);
CREATE INDEX idx_sleep_insights_generated_at ON sleep_insights(generated_at DESC);
CREATE INDEX idx_sleep_insights_category ON sleep_insights(user_id, category);

-- ============================================================================
-- 6. Update cross_service_events table to include sleep events
-- ============================================================================

-- Add sleep event types to existing cross_service_events table
-- This will be handled in the service logic, but documenting expected event types:

/*
New Sleep Event Types for cross_service_events:
- SLEEP_QUALITY_POOR: Poor sleep quality detected
- SLEEP_PATTERN_CONCERNING: Concerning sleep pattern detected  
- SLEEP_DEPRIVATION_SEVERE: Severe sleep deprivation detected
- SLEEP_IMPROVEMENT_NEEDED: Sleep intervention recommended
- SLEEP_CRISIS_THRESHOLD: Sleep-related crisis threshold reached
- SLEEP_MOOD_CORRELATION: Significant sleep-mood correlation detected
- SLEEP_ACADEMIC_IMPACT: Sleep impacting academic performance
*/

-- ============================================================================
-- 7. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for recent sleep summary
CREATE VIEW recent_sleep_summary AS
SELECT 
    s.user_id,
    s.session_date,
    s.total_sleep_duration,
    s.sleep_efficiency,
    s.quality_score,
    s.energy_level,
    CASE 
        WHEN s.total_sleep_duration < 360 THEN 'insufficient' -- < 6 hours
        WHEN s.total_sleep_duration < 420 THEN 'short' -- < 7 hours
        WHEN s.total_sleep_duration > 540 THEN 'long' -- > 9 hours
        ELSE 'normal'
    END as duration_category,
    CASE
        WHEN s.quality_score <= 3 THEN 'poor'
        WHEN s.quality_score <= 6 THEN 'fair'
        WHEN s.quality_score <= 8 THEN 'good'
        ELSE 'excellent'
    END as quality_category
FROM sleep_sessions s
WHERE s.session_date >= CURRENT_DATE - INTERVAL '30 days';

-- View for active patterns summary
CREATE VIEW active_sleep_patterns AS
SELECT 
    sp.user_id,
    sp.pattern_type,
    sp.severity_level,
    sp.confidence_score,
    sp.impact_on_mood,
    sp.impact_on_academic,
    sp.intervention_recommended,
    sp.detection_date
FROM sleep_patterns sp
WHERE sp.status = 'active'
ORDER BY sp.severity_level DESC, sp.confidence_score DESC;

-- ============================================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update sleep_sessions.updated_at
CREATE OR REPLACE FUNCTION update_sleep_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sleep_sessions
CREATE TRIGGER sleep_sessions_updated_at_trigger
    BEFORE UPDATE ON sleep_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_sleep_sessions_updated_at();

-- Function to update sleep_patterns.updated_at
CREATE OR REPLACE FUNCTION update_sleep_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sleep_patterns
CREATE TRIGGER sleep_patterns_updated_at_trigger
    BEFORE UPDATE ON sleep_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_sleep_patterns_updated_at();

-- ============================================================================
-- 9. SAMPLE DATA FOR DEVELOPMENT (Optional)
-- ============================================================================

-- Sample sleep session (for testing)
-- INSERT INTO sleep_sessions (user_id, session_date, bedtime, sleep_onset, wake_time, get_up_time, total_sleep_duration, sleep_efficiency, quality_score, energy_level, data_source)
-- VALUES (
--     (SELECT id FROM users LIMIT 1),
--     CURRENT_DATE - 1,
--     CURRENT_DATE - INTERVAL '1 day' + TIME '23:30:00',
--     CURRENT_DATE - INTERVAL '1 day' + TIME '23:45:00',
--     CURRENT_DATE + TIME '07:15:00',
--     CURRENT_DATE + TIME '07:30:00',
--     435, -- 7 hours 15 minutes
--     92.5, -- Good efficiency
--     7.5, -- Good quality
--     8.0, -- Good energy
--     'manual'
-- );

-- Grant permissions (adjust as needed for your user)
-- GRANT ALL ON sleep_sessions TO soulence_app;
-- GRANT ALL ON sleep_patterns TO soulence_app;
-- GRANT ALL ON sleep_correlations TO soulence_app;
-- GRANT ALL ON sleep_interventions TO soulence_app;
-- GRANT ALL ON sleep_insights TO soulence_app;

-- Comments for documentation
COMMENT ON TABLE sleep_sessions IS 'Core sleep tracking data with comprehensive metrics and environmental factors';
COMMENT ON TABLE sleep_patterns IS 'Detected sleep patterns and behavioral analysis for intervention targeting';
COMMENT ON TABLE sleep_correlations IS 'Statistical correlations between sleep metrics and other wellness indicators';
COMMENT ON TABLE sleep_interventions IS 'Sleep improvement interventions and their effectiveness tracking';
COMMENT ON TABLE sleep_insights IS 'Generated insights and personalized recommendations for users';

COMMENT ON COLUMN sleep_sessions.sleep_efficiency IS 'Percentage calculated as (total_sleep_duration / time_in_bed) * 100';
COMMENT ON COLUMN sleep_sessions.quality_score IS 'Subjective sleep quality rating from 1-10 provided by user';
COMMENT ON COLUMN sleep_patterns.pattern_data IS 'JSON object containing pattern-specific metrics and thresholds';
COMMENT ON COLUMN sleep_correlations.correlation_coefficient IS 'Pearson correlation coefficient between sleep metric and target metric (-1 to 1)';