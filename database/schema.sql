-- Soulence Database Schema
-- PostgreSQL 15+

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('student', 'parent', 'therapist');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE processing_status AS ENUM ('uploaded', 'processing', 'completed', 'failed');
CREATE TYPE message_type AS ENUM ('user', 'ai');
CREATE TYPE signal_type AS ENUM ('completion', 'retry', 'duration', 'skip', 'dropoff');
CREATE TYPE metric_type AS ENUM ('response_quality', 'quiz_accuracy', 'user_satisfaction');
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'flagged');

-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    grade VARCHAR(20),
    school VARCHAR(255),
    parent_emails TEXT[],
    therapist_id UUID REFERENCES users(id),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(100) NOT NULL,
    shared_with VARCHAR(100) NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Parent-Child and Therapist-Patient Relationships
CREATE TABLE parent_child_links (
    parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID REFERENCES users(id) ON DELETE CASCADE,
    linked_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (parent_id, child_id)
);

CREATE TABLE therapist_patient_links (
    therapist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    PRIMARY KEY (therapist_id, patient_id)
);

-- Mood and Mental Health Data
CREATE TABLE mood_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
    emotions TEXT[] NOT NULL,
    notes TEXT,
    logged_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE crisis_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 10),
    trigger_pattern TEXT,
    alert_sent BOOLEAN DEFAULT FALSE,
    notified_contacts TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE symptom_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    physical_symptoms TEXT[],
    mental_symptoms TEXT[],
    severity_scores JSONB,
    notes TEXT,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Academic and Task Management
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    estimated_duration INTEGER, -- in minutes
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE TABLE study_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    routine_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE progress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    time_spent INTEGER NOT NULL, -- in minutes
    completion_percentage INTEGER CHECK (completion_percentage BETWEEN 0 AND 100),
    notes TEXT,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Document Management and RAG System
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    processing_status processing_status DEFAULT 'uploaded',
    ocr_text TEXT,
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    embedding_id VARCHAR(255), -- Pinecone vector ID
    metadata JSONB DEFAULT '{}',
    retrieval_frequency INTEGER DEFAULT 0,
    last_retrieved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
    quality_score DECIMAL(3,2) CHECK (quality_score BETWEEN 0 AND 1),
    validation_status validation_status DEFAULT 'pending',
    generated_at TIMESTAMP DEFAULT NOW()
);

-- AI Conversations and Interactions
CREATE TABLE conversation_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    message_count INTEGER DEFAULT 0,
    purpose VARCHAR(100),
    mood_rating INTEGER CHECK (mood_rating BETWEEN 1 AND 10)
);

CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    message_type message_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES conversation_sessions(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    input_text TEXT NOT NULL,
    output_text TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    processing_time_ms INTEGER,
    feedback_score DECIMAL(3,2) CHECK (feedback_score BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback and Engagement System
CREATE TABLE engagement_signals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID,
    signal_type signal_type NOT NULL,
    signal_value JSONB NOT NULL,
    ai_interaction_id UUID REFERENCES ai_interactions(id),
    context JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type metric_type NOT NULL,
    entity_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    score DECIMAL(3,2) CHECK (score BETWEEN 0 AND 1),
    confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),
    calculated_by VARCHAR(100),
    calculated_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE agent_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    state_data JSONB DEFAULT '{}',
    last_updated TIMESTAMP DEFAULT NOW(),
    UNIQUE(agent_name, user_id)
);

-- AI Summaries and Reports
CREATE TABLE ai_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    summary_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    shared_with UUID[] DEFAULT '{}'
);

CREATE TABLE data_sharing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_types TEXT[] NOT NULL,
    permissions TEXT[] NOT NULL,
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, logged_at DESC);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_user_due_date ON tasks(user_id, due_date);
CREATE INDEX idx_documents_user_created ON documents(user_id, created_at DESC);
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_embedding ON document_chunks(embedding_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_ai_conversations_user_created ON ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_ai_interactions_user_created ON ai_interactions(user_id, created_at DESC);
CREATE INDEX idx_engagement_signals_user_session ON engagement_signals(user_id, session_id);
CREATE INDEX idx_engagement_signals_interaction ON engagement_signals(ai_interaction_id);
CREATE INDEX idx_quality_metrics_entity ON quality_metrics(entity_type, entity_id);
CREATE INDEX idx_agent_states_agent_user ON agent_states(agent_name, user_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_routines_updated_at BEFORE UPDATE ON study_routines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Development
INSERT INTO users (id, email, password_hash, role, is_verified) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'student@example.com', '$2b$10$rOHqYt6xEXwF0q4c4tZ9ReqKFPKMZcnG1zqZJ5l8H0qR4z6v3p2sG', 'student', true),
    ('550e8400-e29b-41d4-a716-446655440001', 'parent@example.com', '$2b$10$rOHqYt6xEXwF0q4c4tZ9ReqKFPKMZcnG1zqZJ5l8H0qR4z6v3p2sG', 'parent', true),
    ('550e8400-e29b-41d4-a716-446655440002', 'therapist@example.com', '$2b$10$rOHqYt6xEXwF0q4c4tZ9ReqKFPKMZcnG1zqZJ5l8H0qR4z6v3p2sG', 'therapist', true);

INSERT INTO user_profiles (user_id, first_name, last_name, grade, preferences) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'Alex', 'Student', '10th', '{"notifications": true, "dailyReminders": true, "crisisAlerts": true, "dataSharing": {"mood": false, "academic": false, "ai_interactions": false}}');

-- Comments
COMMENT ON TABLE users IS 'Core user accounts for authentication';
COMMENT ON TABLE mood_logs IS 'Student mood tracking data';
COMMENT ON TABLE tasks IS 'Academic tasks and assignments';
COMMENT ON TABLE documents IS 'Uploaded documents for RAG processing';
COMMENT ON TABLE ai_interactions IS 'AI-powered conversations and responses';
COMMENT ON TABLE engagement_signals IS 'Passive feedback signals for AI improvement';
COMMENT ON TABLE quality_metrics IS 'AI response and content quality measurements';