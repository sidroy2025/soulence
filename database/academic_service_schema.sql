-- Academic Service Schema Extensions
-- Add Canvas LMS integration tables and additional academic tables

-- Canvas OAuth and Connection Management
CREATE TABLE canvas_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    canvas_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    canvas_user_name VARCHAR(255),
    canvas_user_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    connected_at TIMESTAMP DEFAULT NOW(),
    disconnected_at TIMESTAMP,
    last_synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Canvas Courses
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    canvas_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    course_code VARCHAR(100),
    term VARCHAR(100),
    teachers JSONB,
    current_grade DECIMAL(5,2),
    workflow_state VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    last_synced TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Canvas Assignments
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    canvas_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    lock_date TIMESTAMP,
    unlock_date TIMESTAMP,
    points_possible DECIMAL(8,2),
    submission_types TEXT[],
    workflow_state VARCHAR(50),
    priority task_priority DEFAULT 'medium',
    academic_stress_weight DECIMAL(3,2) DEFAULT 1.0,
    last_synced TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Canvas Assignment Submissions
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    canvas_submission_id VARCHAR(255) UNIQUE,
    submitted_at TIMESTAMP,
    score DECIMAL(8,2),
    grade VARCHAR(50),
    workflow_state VARCHAR(50),
    late BOOLEAN DEFAULT FALSE,
    missing BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Academic Stress Tracking
CREATE TABLE academic_stress_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stress_level VARCHAR(20) CHECK (stress_level IN ('low', 'medium', 'high')),
    stress_score DECIMAL(5,2),
    indicators JSONB,
    calculated_at TIMESTAMP DEFAULT NOW()
);

-- Cross-Service Events for integration
CREATE TABLE cross_service_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_service VARCHAR(50) NOT NULL,
    target_service VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update existing tasks table to support Canvas assignments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES assignments(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);

-- Indexes for performance
CREATE INDEX idx_canvas_connections_user_id ON canvas_connections(user_id);
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_courses_canvas_id ON courses(canvas_id);
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_canvas_id ON assignments(canvas_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_user_id ON assignment_submissions(user_id);
CREATE INDEX idx_academic_stress_logs_user_id ON academic_stress_logs(user_id);
CREATE INDEX idx_academic_stress_logs_calculated_at ON academic_stress_logs(calculated_at);
CREATE INDEX idx_cross_service_events_user_id ON cross_service_events(user_id);
CREATE INDEX idx_cross_service_events_processed ON cross_service_events(processed);
CREATE INDEX idx_tasks_assignment_id ON tasks(assignment_id);
CREATE INDEX idx_tasks_course_id ON tasks(course_id);

-- Comments
COMMENT ON TABLE canvas_connections IS 'Canvas LMS OAuth connections';
COMMENT ON TABLE courses IS 'Canvas courses synchronized from LMS';
COMMENT ON TABLE assignments IS 'Canvas assignments with stress calculation data';
COMMENT ON TABLE assignment_submissions IS 'Canvas assignment submissions and grades';
COMMENT ON TABLE academic_stress_logs IS 'Academic stress level calculations over time';
COMMENT ON TABLE cross_service_events IS 'Events for inter-service communication';