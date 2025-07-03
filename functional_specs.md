# Soulence - Complete Functional Specifications

**Version 2.1** | Mental Wellness and Academic Management Platform  
**Target Users**: Students (13-25), Parents/Guardians, Mental Health Professionals

---

## 🎯 Executive Summary

Soulence is an AI-powered mental wellness platform that integrates academic management, emotional support, learning assistance, and sleep health monitoring. The platform uses passive feedback loops and multi-agent AI systems to provide personalized support without requiring explicit user feedback.

**Core Innovation**: Connecting academic performance, sleep patterns, and emotional wellness through intelligent AI agents that learn and adapt to each student's unique needs.

---

## 🏗️ System Architecture

```
Soulence Platform Architecture
├── Frontend (React + TypeScript)
│   ├── Web Application (localhost:3000)
│   └── Mobile App (React Native - Future)
├── Backend Microservices (Node.js + TypeScript)
│   ├── Auth Service (Port 3001) ✅ COMPLETE
│   ├── Wellness Service (Port 3002) ✅ COMPLETE  
│   ├── Academic Service (Port 3003) 🎯 TO BUILD
│   ├── Learning Service (Port 3004) 🎯 TO BUILD
│   ├── Care Service (Port 3005) 🎯 TO BUILD
│   └── Sleep Service (Port 3006) 🎯 TO BUILD
├── AI/ML Services (Python + LangGraph)
│   ├── Multi-Agent Orchestration
│   ├── Passive Feedback Processing
│   └── RAG Document Intelligence
└── Infrastructure
    ├── PostgreSQL (Primary database)
    ├── Redis (Caching/Sessions)
    ├── InfluxDB (Time-series data)
    ├── Kafka (Event streaming)
    └── Monitoring (Prometheus/Grafana)
```

---

## 📋 Module Specifications

### 🌟 Module 1: Emotional Wellness (Soulence Calm) ✅ COMPLETE

**Purpose**: Enable students to track and manage their emotional well-being with AI-powered support.

#### Features (All Implemented):
- **Daily Mood Tracker**: 1-10 scale with 15+ emotion categories
- **AI Buddy**: Supportive companion with adaptive personality
- **Coping Toolkit**: Breathing exercises, journaling prompts, meditation
- **Crisis Detection**: Automatic alerts for concerning patterns (mood ≤ 3)

#### Technical Implementation:
- **Backend**: Wellness Service (Port 3002) - Complete
- **Database**: mood_logs, crisis_alerts, ai_conversations tables
- **Frontend**: Interactive mood picker, crisis support resources
- **AI**: Basic supportive responses (advanced AI agents to be added)

---

### 📚 Module 2: Academic Support (Soulence Focus) 🎯 TO BUILD

**Purpose**: Help students organize academic responsibilities while considering mental health state.

#### Canvas LMS Integration Requirements:

##### **FR-FOC-001: Canvas OAuth Authentication**
- User clicks "Connect Canvas" in Soulence interface
- OAuth 2.0 redirect to student's Canvas instance
- User grants permissions for assignments, grades, calendar access
- Soulence stores encrypted access token for API calls
- **Success Criteria**: One-click Canvas connection with clear permission display

##### **FR-FOC-002: Real-time Assignment Synchronization**
- Automatic import of all Canvas assignments every 15 minutes
- Extract: title, description, due date, points possible, course info
- Detect assignment changes (new, modified due dates, deleted)
- Create corresponding Soulence tasks with Canvas metadata
- **Success Criteria**: Canvas assignments appear in Soulence within 15 minutes

##### **FR-FOC-003: Intelligent Task Prioritization**
```typescript
Priority Calculation Algorithm:
- High: Due within 24 hours OR points ≥ 100 OR user stress level high
- Medium: Due within 72 hours OR points ≥ 50 OR moderate stress
- Low: Due > 72 hours AND points < 50 AND normal stress
```
- **Success Criteria**: Priority adjusts automatically based on multiple factors

##### **FR-FOC-004: Academic Stress Level Detection**
```typescript
Stress Indicators:
- Overdue assignments (weight: 2.0)
- Assignments due within 24 hours (weight: 1.5)  
- Recent grade decline (weight: 1.0)
- High assignment density (weight: 1.0)

Stress Level = sum(indicators * weights)
- Low: 0-3, Medium: 4-7, High: 8+
```
- **Success Criteria**: Academic stress feeds into mental health monitoring

##### **FR-FOC-005: Unified Calendar View**
- Display Canvas assignments alongside personal tasks
- Color-code by priority and course
- Show deadline countdown timers
- Filter by course, due date, completion status
- **Success Criteria**: All academic deadlines visible in one calendar

#### Database Schema (Academic):
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  canvas_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  course_code VARCHAR(100),
  term VARCHAR(100),
  teachers JSONB,
  current_grade DECIMAL(5,2),
  workflow_state VARCHAR(50),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  canvas_id VARCHAR(255) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  lock_date TIMESTAMP,
  unlock_date TIMESTAMP,
  points_possible DECIMAL(8,2),
  submission_types TEXT[],
  workflow_state VARCHAR(50),
  priority ENUM('low', 'medium', 'high'),
  academic_stress_weight DECIMAL(3,2),
  last_synced TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id),
  user_id UUID REFERENCES users(id),
  canvas_submission_id VARCHAR(255),
  submitted_at TIMESTAMP,
  score DECIMAL(8,2),
  grade VARCHAR(50),
  workflow_state VARCHAR(50),
  late BOOLEAN DEFAULT FALSE,
  missing BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints (Academic Service):
```typescript
// Canvas Integration
POST   /api/academic/canvas/auth          // Initiate OAuth
GET    /api/academic/canvas/callback      // Handle OAuth callback
POST   /api/academic/canvas/sync          // Manual sync trigger
GET    /api/academic/canvas/status        // Connection status

// Task Management  
GET    /api/academic/tasks                // Get user tasks
POST   /api/academic/tasks                // Create manual task
PUT    /api/academic/tasks/:id            // Update task
DELETE /api/academic/tasks/:id            // Delete task

// Analytics
GET    /api/academic/stress-level         // Current academic stress
GET    /api/academic/performance          // Grade trends
GET    /api/academic/workload            // Upcoming workload analysis
```

---

### 📖 Module 3: RAG-Based Learning (Soulence Learn) 🎯 TO BUILD

**Purpose**: Transform Canvas assignments and uploaded documents into interactive learning experiences.

#### Integration with Canvas:
##### **FR-LEA-001: Canvas Assignment Content Extraction**
- Automatically process Canvas assignment descriptions
- Extract learning objectives, required readings, key concepts
- Convert to searchable knowledge base entries
- Generate study questions from assignment content
- **Success Criteria**: Canvas assignments become queryable study materials

##### **FR-LEA-002: Document Processing Pipeline**
- OCR processing for uploaded PDFs and images
- Semantic chunking and embedding generation
- Vector storage in Pinecone for similarity search
- Metadata extraction (subject, difficulty, topic)
- **Success Criteria**: Uploaded documents become AI-queryable within 2 minutes

##### **FR-LEA-003: AI-Powered Study Assistant**
- Natural language queries about study materials
- Contextual responses with source citations
- Follow-up question suggestions
- Difficulty-adaptive explanations
- **Success Criteria**: Students can ask questions and get accurate, cited answers

##### **FR-LEA-004: Adaptive Quiz Generation**
- Generate practice questions from Canvas assignments and uploaded materials
- Adjust difficulty based on student performance
- Focus on identified knowledge gaps
- Provide explanations for incorrect answers
- **Success Criteria**: Personalized quizzes that improve learning outcomes

#### LangGraph Agent Implementation:
```python
# Multi-Agent Learning System
Agents:
1. Query Processing Agent - Analyzes student questions
2. Content Retrieval Agent - Searches relevant documents  
3. Response Generation Agent - Creates educational responses
4. Quality Validation Agent - Ensures response accuracy
5. Adaptation Agent - Improves based on student engagement
```

---

### 🌙 Module 4: Sleep Pattern Monitoring (Soulence REST) 🎯 TO BUILD

**Purpose**: Monitor sleep patterns passively and correlate with academic performance and mental health.

#### Sleep Tracking Requirements:

##### **FR-RES-001: Sleep Session Logging**
- Manual sleep time entry (bedtime, wake time, quality rating)
- Optional integration with Google Nest Hub for contactless monitoring
- Android Digital Wellbeing sleep data import
- Automatic sleep duration and efficiency calculation
- **Success Criteria**: Easy sleep logging with multiple input methods

##### **FR-RES-002: Sleep Pattern Analysis**
```typescript
Sleep Pattern Detection:
- Delayed Sleep Phase: Consistently sleeping after 2 AM
- Sleep Fragmentation: >3 wake episodes per night
- Insufficient Sleep: <6 hours consistently  
- Irregular Schedule: >2 hour variance in bedtime
- Advanced Sleep Phase: Consistently sleeping before 9 PM
```
- **Success Criteria**: Automatic categorization of sleep patterns

##### **FR-RES-003: Academic-Sleep Correlation**
- Correlate sleep quality with assignment completion rates
- Link sleep duration to mood scores
- Identify sleep impact on academic performance
- Generate insights about optimal sleep for individual students
- **Success Criteria**: Clear correlation insights between sleep and performance

##### **FR-RES-004: Gentle Sleep Interventions**
```typescript
Intervention Triggers:
- Bedtime Reminder: 30 minutes before optimal bedtime
- Sleep Hygiene Tips: After 3 nights of poor sleep
- Schedule Adjustment: For persistent delayed phase
- Crisis Escalation: After 5+ nights of <4 hours sleep
```
- **Success Criteria**: Non-intrusive interventions that improve sleep habits

#### Database Schema (Sleep):
```sql
CREATE TABLE sleep_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_date DATE NOT NULL,
  bedtime TIMESTAMP,
  sleep_onset TIMESTAMP,
  wake_time TIMESTAMP,
  total_sleep_duration INTEGER, -- minutes
  sleep_efficiency DECIMAL(4,2), -- percentage
  wake_episodes INTEGER DEFAULT 0,
  quality_score DECIMAL(3,2), -- 1-10 user rating
  data_source ENUM('manual', 'nest_hub', 'digital_wellbeing', 'estimated'),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

CREATE TABLE sleep_patterns (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  pattern_type ENUM('normal', 'delayed_phase', 'advanced_phase', 'irregular', 'fragmented', 'insufficient'),
  detection_date DATE,
  confidence_score DECIMAL(3,2),
  pattern_data JSONB, -- Specific pattern metrics
  intervention_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sleep_correlations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  correlation_type ENUM('mood', 'academic', 'stress', 'social'),
  correlation_coefficient DECIMAL(4,3), -- -1 to 1
  significance_level DECIMAL(3,2),
  time_period_days INTEGER,
  data_points INTEGER,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints (Sleep Service):
```typescript
// Sleep Logging
POST   /api/sleep/sessions               // Log sleep session
GET    /api/sleep/sessions               // Get sleep history
PUT    /api/sleep/sessions/:id           // Update session
DELETE /api/sleep/sessions/:id           // Delete session

// Analytics
GET    /api/sleep/patterns               // Detected patterns
GET    /api/sleep/correlations           // Mood/academic correlations
GET    /api/sleep/insights               // Personalized insights
GET    /api/sleep/recommendations        // Sleep improvement suggestions

// Interventions
POST   /api/sleep/interventions          // Trigger intervention
GET    /api/sleep/interventions/history  // Past interventions
```

---

### 🩺 Module 5: Mental Health Insights (Soulence Care) 🎯 TO BUILD

**Purpose**: Provide mental health professionals with comprehensive, privacy-controlled insights.

#### Professional Integration Requirements:

##### **FR-CAR-001: Holistic Health Reports**
- Combine mood, sleep, academic, and engagement data
- Generate weekly/monthly professional reports
- Include trend analysis and risk indicators
- Maintain HIPAA compliance standards
- **Success Criteria**: Comprehensive reports that aid clinical decision-making

##### **FR-CAR-002: Crisis Alert System**
- Multi-dimensional crisis detection (mood + sleep + academic stress)
- Configurable alert thresholds for different professionals
- Secure notification delivery (email, SMS, in-app)
- Crisis escalation protocols
- **Success Criteria**: Timely, actionable crisis alerts

##### **FR-CAR-003: Data Sharing Controls**
- Granular permission system (what data, with whom, for how long)
- Easy revocation of access
- Audit trail of all data access
- Parent/guardian controls for minors
- **Success Criteria**: Complete user control over data sharing

---

## 🔗 Integration Requirements

### Canvas LMS Integration Specifications:

#### OAuth 2.0 Implementation:
```typescript
Canvas OAuth Flow:
1. User clicks "Connect Canvas" → Redirect to Canvas OAuth
2. Canvas auth URL: https://[school].instructure.com/login/oauth2/auth
3. Required scopes: 
   - url:GET|/api/v1/courses
   - url:GET|/api/v1/assignments  
   - url:GET|/api/v1/calendar_events
   - url:GET|/api/v1/users/:user_id/courses
4. Handle callback with authorization code
5. Exchange for access token at /login/oauth2/token
6. Store encrypted token for API calls
```

#### API Integration Points:
```typescript
Key Canvas APIs to Implement:
- GET /api/v1/courses (active enrollment only)
- GET /api/v1/courses/:id/assignments (include submissions)
- GET /api/v1/calendar_events (assignment events)
- GET /api/v1/courses/:id/enrollments (for grades)
- GET /api/v1/users/:id/courses (user's courses)
```

#### Real-time Sync Strategy:
- **Initial Sync**: Full import on first connection
- **Incremental Sync**: Every 15 minutes for changes
- **Webhook Preparation**: Ready for institutional partnerships
- **Error Handling**: Graceful degradation if Canvas is unavailable

### Sleep Device Integration (Future):
- **Google Nest Hub**: Contactless sleep monitoring
- **Android Digital Wellbeing**: Screen time correlation with sleep
- **Fitbit/Apple Watch**: Optional wearable integration
- **Smart Home**: Environmental factors (temperature, noise)

---

## 🎯 User Stories and Acceptance Criteria

### Student User Stories:

#### Academic Management:
**Story**: "As a student using Canvas, I want my assignments to automatically appear in Soulence so I don't have to manually track deadlines."
- **Acceptance**: Canvas assignments sync within 15 minutes
- **Acceptance**: Due dates trigger appropriate priority levels
- **Acceptance**: Assignment changes reflect immediately

**Story**: "As a student feeling overwhelmed, I want to see how my workload affects my mood so I can better manage stress."
- **Acceptance**: Academic stress level calculation visible
- **Acceptance**: Correlation between assignment density and mood scores
- **Acceptance**: Suggestions for workload management

#### Sleep Management:
**Story**: "As a student with irregular sleep, I want to understand how my sleep affects my academic performance."
- **Acceptance**: Sleep-academic performance correlations displayed
- **Acceptance**: Insights about optimal sleep duration for performance
- **Acceptance**: Gentle recommendations for sleep improvement

**Story**: "As a student in crisis, I want the system to detect sleep-related warning signs and provide appropriate support."
- **Acceptance**: Severe sleep disruption triggers crisis protocols
- **Acceptance**: Sleep crisis integrates with overall mental health monitoring
- **Acceptance**: Emergency resources specific to sleep-related crisis

### Parent User Stories:

**Story**: "As a parent, I want to be alerted if my child's academic stress or sleep patterns indicate concerning mental health trends."
- **Acceptance**: Configurable alerts for academic overwhelm
- **Acceptance**: Sleep disruption notifications with context
- **Acceptance**: Privacy-respecting communication

### Therapist User Stories:

**Story**: "As a therapist, I want comprehensive reports that show the relationship between my client's sleep, academics, and mood."
- **Acceptance**: Multi-dimensional reports with correlations
- **Acceptance**: Trend analysis over customizable time periods
- **Acceptance**: Actionable insights for treatment planning

---

## 🔐 Privacy and Security Requirements

### Data Protection:
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Role-based permissions with audit logging
- **Consent Management**: Granular, revocable permissions
- **Data Minimization**: Collect only necessary information
- **Right to Deletion**: Complete data removal capability

### Compliance:
- **FERPA**: Educational privacy for student records
- **HIPAA**: Healthcare privacy for mental health data
- **GDPR**: European data protection standards
- **COPPA**: Child online privacy (users under 13)

### Canvas Integration Security:
- **OAuth 2.0**: Industry standard authentication
- **Token Management**: Secure storage with refresh rotation
- **Scope Limitation**: Minimum necessary permissions
- **API Rate Limiting**: Respect Canvas API limits
- **Error Handling**: No sensitive data in logs

---

## 📊 Success Metrics

### User Engagement:
- **Daily Active Users**: 70%+ of registered users
- **Feature Adoption**: 80%+ use mood tracking, 60%+ use academic features
- **Session Duration**: Average 10+ minutes per session
- **Retention**: 85% at 30 days, 70% at 90 days

### Academic Outcomes:
- **Task Completion**: 15% improvement in assignment completion rates
- **Stress Management**: 20% reduction in academic stress levels
- **Grade Correlation**: Positive correlation between app usage and grades

### Mental Health Impact:
- **Crisis Prevention**: 30% reduction in crisis episodes through early intervention
- **Sleep Improvement**: 25% improvement in sleep quality scores
- **Professional Engagement**: 40% more productive therapy sessions with data insights

### Technical Performance:
- **Canvas Sync**: 99% successful sync rate, <15 minute latency
- **Response Time**: <2 seconds for 95% of user interactions
- **Uptime**: 99.9% availability for crisis features
- **Data Accuracy**: 99%+ accuracy in mood-academic-sleep correlations

---

## 🚀 Implementation Timeline

### Phase 1: Canvas Integration (2-3 weeks)
- Week 1: Academic Service setup, Canvas OAuth implementation
- Week 2: Assignment sync, task management, priority algorithms
- Week 3: Frontend integration, calendar view, testing with real Canvas data

### Phase 2: Sleep Monitoring (2-3 weeks)
- Week 1: Sleep Service setup, manual logging interface
- Week 2: Pattern analysis algorithms, correlation calculations
- Week 3: Intervention system, crisis integration, frontend interface

### Phase 3: AI Enhancement (3-4 weeks)
- Week 1-2: LangGraph agent system setup
- Week 3: Canvas assignment content processing for Soulence Learn
- Week 4: Passive feedback loop implementation

### Phase 4: Professional Tools (2-3 weeks)
- Week 1-2: Care Service for therapist reports
- Week 3: Advanced analytics dashboard, professional interface

---

## 🧪 Testing Strategy

### Canvas Integration Testing:
- **OAuth Flow**: Test with real Canvas sandbox account
- **Assignment Sync**: Verify accuracy with various Canvas configurations
- **Edge Cases**: Handle Canvas downtime, API changes, permission changes
- **Performance**: Test with high assignment volumes

### Sleep Monitoring Testing:
- **Pattern Detection**: Validate algorithms with clinical sleep data
- **Correlation Accuracy**: Test mood-sleep-academic correlations
- **Intervention Logic**: Verify appropriate trigger conditions
- **Edge Cases**: Handle missing data, irregular schedules

### Integration Testing:
- **Cross-Module**: Verify data flows between all services
- **Real-time**: Test event streaming and notification delivery
- **Security**: Penetration testing of OAuth and data access
- **Performance**: Load testing with concurrent users

---

## 📱 User Experience Guidelines

### Design Principles:
- **Calm Technology**: Non-intrusive, supportive interface
- **Privacy First**: Clear data usage explanations
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile-First**: Responsive design for all screen sizes

### Canvas Integration UX:
- **One-Click Connection**: Simple OAuth flow with clear permissions
- **Status Indicators**: Clear sync status and connection health
- **Error Recovery**: Helpful error messages and reconnection flow
- **Data Transparency**: Show what Canvas data is being used

### Sleep Monitoring UX:
- **Frictionless Logging**: Quick sleep time entry
- **Visual Insights**: Intuitive charts and pattern visualization
- **Gentle Interventions**: Supportive, non-judgmental recommendations
- **Progress Tracking**: Motivating progress visualization

---

**This comprehensive functional specification provides the blueprint for building a complete, integrated mental wellness platform that serves students, families, and mental health professionals while maintaining the highest standards of privacy and clinical effectiveness.**