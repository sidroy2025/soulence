# 🏗️ Soulence Technical Architecture

**Last Updated:** July 2025  
**Status:** Phase 2A Complete - Academic Integration Architecture Deployed  
**Architecture Pattern:** Microservices with Event-Driven Integration

---

## 🎯 **Architecture Overview**

Soulence follows a **microservices architecture** pattern with clear separation of concerns, event-driven communication, and scalable infrastructure designed to support thousands of concurrent users.

### **Core Principles**
- **Microservices Separation:** Each service handles a specific domain (Auth, Wellness, Academic)
- **Event-Driven Integration:** Services communicate through events for loose coupling
- **Type Safety:** Full TypeScript implementation across all layers
- **Security First:** OAuth 2.0, JWT tokens, encrypted storage
- **Mobile-First:** Responsive design with progressive enhancement
- **Scalability Ready:** Horizontal scaling with Docker and Redis

---

## 🏛️ **System Architecture Diagram**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            SOULENCE PLATFORM                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────────────────────────┐ │
│  │   Client Layer  │    │                Backend Services                  │ │
│  │                 │    │                                                  │ │
│  │  ┌───────────┐  │    │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │ │
│  │  │   React   │◄─┼────┼─►│    Auth     │◄─│  Wellness   │◄─│ Academic │ │ │
│  │  │ Frontend  │  │    │  │  Service    │  │   Service   │  │ Service  │ │ │
│  │  │(Port 3000)│  │    │  │(Port 3001)  │  │(Port 3002)  │  │(Port 3003│ │ │
│  │  └───────────┘  │    │  └─────────────┘  └─────────────┘  └──────────┘ │ │
│  └─────────────────┘    │         │               │               │       │ │
│                         │         ▼               ▼               ▼       │ │
│  ┌─────────────────┐    │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │ │
│  │  External APIs  │    │  │   Events    │  │    Redis    │  │ Canvas   │ │ │
│  │                 │    │  │    Bus      │  │   Cache     │  │   LMS    │ │ │
│  │ ┌─────────────┐ │    │  │(Kafka Ready)│  │             │  │   API    │ │ │
│  │ │ Canvas LMS  │◄┼────┼─►└─────────────┘  └─────────────┘  └──────────┘ │ │
│  │ └─────────────┘ │    │                                                  │ │
│  └─────────────────┘    └──────────────────────────────────────────────────┘ │
│                                                 │                            │
│                                                 ▼                            │
│  ┌──────────────────────────────────────────────────────────────────────────┐ │
│  │                         Data Layer                                       │ │
│  │                                                                          │ │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐  │ │
│  │  │ PostgreSQL  │    │   InfluxDB  │    │   MinIO     │    │Prometheus│  │ │
│  │  │  Database   │    │(Time-Series)│    │(S3 Storage) │    │(Metrics) │  │ │
│  │  │(21+ Tables) │    │             │    │             │    │          │  │ │
│  │  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘  │ │
│  └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Technology Stack**

### **Frontend Architecture**
```typescript
React 18 + TypeScript
├── State Management: Zustand
├── Styling: Tailwind CSS
├── Forms: React Hook Form
├── Routing: React Router v6
├── Build Tool: Vite
├── HTTP Client: Fetch API
└── Notifications: React Hot Toast
```

### **Backend Architecture**
```typescript
Node.js + Express + TypeScript
├── Authentication: JWT + Refresh Tokens
├── Validation: Joi
├── ORM: Raw SQL with pg (PostgreSQL)
├── Caching: Redis
├── Security: bcrypt, helmet, cors
├── Logging: Winston
└── Environment: dotenv
```

### **Database Layer**
```sql
PostgreSQL 15+
├── Schema: 21+ normalized tables
├── Relationships: Foreign keys with CASCADE
├── Indexing: Performance optimized
├── Constraints: Data integrity enforced
├── Migrations: Version controlled
└── Backup: Automated snapshots ready
```

### **Infrastructure**
```yaml
Docker + Docker Compose
├── PostgreSQL: Primary database
├── Redis: Caching and sessions
├── InfluxDB: Time-series data (ready)
├── Kafka: Event streaming (ready)
├── MinIO: S3-compatible storage (ready)
├── Prometheus: Metrics collection (ready)
├── Grafana: Monitoring dashboards (ready)
└── Elasticsearch: Log aggregation (ready)
```

---

## 📦 **Service Architecture**

### **Auth Service (Port 3001)**
```typescript
Purpose: User authentication and authorization
├── Registration/Login flows
├── JWT token management
├── Password reset functionality
├── Role-based access control
├── Email verification
└── Session management

API Endpoints:
├── POST /api/v1/auth/register
├── POST /api/v1/auth/login
├── POST /api/v1/auth/refresh
├── POST /api/v1/auth/logout
├── POST /api/v1/auth/forgot-password
├── POST /api/v1/auth/reset-password
└── GET  /api/v1/auth/verify-email
```

### **Wellness Service (Port 3002)**
```typescript
Purpose: Mental health tracking and crisis intervention
├── Mood logging (1-10 scale)
├── Emotion categorization (15+ emotions)
├── Crisis detection (score ≤ 3)
├── Mood analytics and trends
├── Crisis alert system
└── Support resource management

API Endpoints:
├── POST /api/v1/wellness/mood
├── GET  /api/v1/wellness/mood/history
├── GET  /api/v1/wellness/mood/analytics
├── GET  /api/v1/wellness/crisis/resources
├── POST /api/v1/wellness/crisis/alert
└── GET  /api/v1/wellness/mood/today
```

### **Academic Service (Port 3003)** ✨ **NEW**
```typescript
Purpose: Academic management and Canvas LMS integration
├── Canvas OAuth 2.0 authentication
├── Assignment synchronization (15-min intervals)
├── Task management (CRUD operations)
├── Smart task prioritization
├── Academic stress calculation
└── Cross-service wellness integration

API Endpoints:
├── Canvas Integration:
│   ├── GET  /api/v1/academic/canvas/auth-url
│   ├── POST /api/v1/academic/canvas/callback
│   ├── GET  /api/v1/academic/canvas/status
│   ├── POST /api/v1/academic/canvas/sync
│   └── DELETE /api/v1/academic/canvas/disconnect
├── Task Management:
│   ├── GET  /api/v1/academic/tasks
│   ├── POST /api/v1/academic/tasks
│   ├── PUT  /api/v1/academic/tasks/:id
│   └── DELETE /api/v1/academic/tasks/:id
└── Analytics:
    ├── GET  /api/v1/academic/analytics/stress
    └── GET  /api/v1/academic/analytics/overview
```

---

## 🗄️ **Database Architecture**

### **Core Schema Design**
```sql
-- User Management Layer
users (id, email, password_hash, role, created_at)
├── user_profiles (user_id, first_name, last_name, phone, ...)
├── user_consents (user_id, consent_type, granted, ...)
└── Relationships:
    ├── parent_child_links (parent_id, child_id, ...)
    └── therapist_patient_links (therapist_id, patient_id, ...)

-- Wellness Tracking Layer
mood_logs (id, user_id, mood_score, emotions, notes, ...)
├── crisis_alerts (id, user_id, mood_log_id, severity, ...)
└── symptom_logs (id, user_id, symptoms, severity, ...)

-- Academic Integration Layer ✨ NEW
canvas_connections (id, user_id, access_token, refresh_token, ...)
├── courses (id, user_id, canvas_course_id, name, ...)
├── assignments (id, course_id, canvas_assignment_id, ...)
├── assignment_submissions (id, assignment_id, ...)
├── academic_stress_logs (id, user_id, stress_level, ...)
└── cross_service_events (id, source_service, event_type, ...)

-- Task Management Layer
tasks (id, user_id, title, description, due_date, ...)
├── study_routines (id, user_id, routine_data, ...)
└── progress_logs (id, user_id, task_id, ...)

-- AI Integration Layer (Ready)
conversation_sessions (id, user_id, ...)
├── ai_conversations (id, session_id, ...)
├── ai_interactions (id, conversation_id, ...)
└── documents (id, user_id, content, ...)
    └── document_chunks (id, document_id, ...)
```

### **Relationship Design**
- **One-to-Many:** Users → Mood Logs, Users → Tasks
- **Many-to-Many:** Users ↔ Users (Parent-Child, Therapist-Patient)
- **Cross-Service:** Academic Stress → Wellness Monitoring
- **Event-Driven:** Academic Service → Wellness Service communication

---

## 🔄 **Event-Driven Architecture**

### **Cross-Service Communication**
```typescript
Event Flow:
Academic Service → Event Bus → Wellness Service

Event Types:
├── ACADEMIC_STRESS_HIGH
│   ├── Trigger: Academic stress level ≥ 7/10
│   ├── Payload: { userId, stressLevel, factors }
│   └── Action: Wellness service creates stress alert
├── ASSIGNMENT_OVERDUE
│   ├── Trigger: Assignment past due date
│   ├── Payload: { userId, assignmentId, daysPastDue }
│   └── Action: Wellness service monitors for mood impact
└── TASK_COMPLETION_PATTERN
    ├── Trigger: Task completion rate analysis
    ├── Payload: { userId, completionRate, trend }
    └── Action: Academic stress calculation adjustment
```

### **Event Storage**
```sql
cross_service_events Table:
├── id (PRIMARY KEY)
├── source_service (auth|wellness|academic)
├── target_service (auth|wellness|academic)
├── event_type (stress_alert|assignment_due|...)
├── payload (JSONB data)
├── processed (boolean)
├── created_at (timestamp)
└── processed_at (timestamp)
```

---

## 🔐 **Security Architecture**

### **Authentication Flow**
```
1. User Login → Auth Service
2. Credentials Validation → Database
3. JWT Generation → Access Token (15min) + Refresh Token (7 days)
4. Token Storage → Redis (refresh tokens)
5. API Requests → Bearer token validation
6. Token Refresh → Automatic rotation
```

### **Canvas OAuth 2.0 Flow**
```
1. User clicks "Connect Canvas"
2. Frontend → Academic Service /auth-url
3. Redirect to Canvas OAuth endpoint
4. User grants permissions
5. Canvas callback → Academic Service
6. Exchange code for access token
7. Store encrypted tokens → PostgreSQL
8. Begin assignment synchronization
```

### **Data Protection**
```typescript
Security Layers:
├── Input Validation: Joi schemas for all endpoints
├── SQL Injection Prevention: Parameterized queries
├── Password Security: bcrypt with salt rounds
├── Token Encryption: JWT with RS256 signatures
├── OAuth Token Storage: AES encryption at rest
├── Rate Limiting: Redis-based request throttling
├── CORS Configuration: Restricted origins
└── Headers Security: Helmet.js protection
```

---

## 📱 **Frontend Architecture**

### **Component Hierarchy**
```typescript
App
├── Router
│   ├── Layout (Navigation + Auth)
│   ├── LoginPage
│   ├── DashboardPage
│   ├── MoodPage
│   ├── CrisisPage
│   └── AcademicPage ✨ NEW
│       ├── AcademicDashboard
│       ├── TaskList
│       ├── CreateTaskForm
│       └── CanvasConnection
└── Providers
    ├── AuthProvider
    ├── ToastProvider
    └── ErrorBoundary
```

### **State Management**
```typescript
Zustand Stores:
├── authStore
│   ├── user: User | null
│   ├── token: string | null
│   ├── login: (credentials) => Promise<void>
│   └── logout: () => void
├── wellnessStore
│   ├── todaysMood: MoodLog | null
│   ├── moodHistory: MoodLog[]
│   ├── logMood: (mood) => Promise<void>
│   └── fetchMoodHistory: () => Promise<void>
└── academicStore ✨ NEW
    ├── tasks: Task[]
    ├── canvasConnection: CanvasConnection | null
    ├── stressLevel: StressLevel
    ├── fetchTasks: () => Promise<void>
    ├── createTask: (task) => Promise<void>
    ├── updateTask: (id, updates) => Promise<void>
    ├── deleteTask: (id) => Promise<void>
    └── connectCanvas: () => Promise<void>
```

### **API Integration**
```typescript
Service Layer:
├── api.ts (Base HTTP client)
├── authService.ts (Authentication)
├── wellnessService.ts (Mood tracking)
├── academicService.ts (Academic management) ✨ NEW
└── mockApi.ts (Demo mode implementation)

Mock API Features:
├── Realistic demo data (6 academic tasks)
├── Canvas connection simulation
├── Academic stress calculation
├── Task management operations
└── Cross-service integration demo
```

---

## 🚀 **Deployment Architecture**

### **Docker Infrastructure**
```yaml
docker-compose.yml Services:
├── postgres (Database)
├── redis (Cache)
├── auth-service (Port 3001)
├── wellness-service (Port 3002)
├── academic-service (Port 3003) ✨ NEW
├── Monitoring Stack (Ready):
│   ├── prometheus (Metrics)
│   ├── grafana (Dashboards)
│   ├── influxdb (Time-series)
│   └── elasticsearch (Logs)
└── Storage (Ready):
    └── minio (S3-compatible)
```

### **Environment Configuration**
```bash
Production Environment Variables:
├── Database Configuration:
│   ├── POSTGRES_HOST
│   ├── POSTGRES_DB
│   ├── POSTGRES_USER
│   └── POSTGRES_PASSWORD
├── Redis Configuration:
│   ├── REDIS_HOST
│   └── REDIS_PORT
├── JWT Configuration:
│   ├── JWT_SECRET
│   └── JWT_REFRESH_SECRET
├── Canvas OAuth Configuration: ✨ NEW
│   ├── CANVAS_CLIENT_ID
│   ├── CANVAS_CLIENT_SECRET
│   ├── CANVAS_AUTH_URL
│   ├── CANVAS_TOKEN_URL
│   └── CANVAS_API_URL
└── Service Configuration:
    ├── AUTH_SERVICE_PORT=3001
    ├── WELLNESS_SERVICE_PORT=3002
    └── ACADEMIC_SERVICE_PORT=3003
```

### **Scaling Strategy**
```typescript
Horizontal Scaling:
├── Load Balancer → Multiple frontend instances
├── API Gateway → Multiple service instances
├── Database → Read replicas + connection pooling
├── Redis → Redis Cluster for high availability
├── File Storage → S3/MinIO distributed storage
└── Monitoring → Centralized logging and metrics

Container Orchestration Ready:
├── Kubernetes deployment configs
├── Health check endpoints
├── Graceful shutdown handling
├── Resource limits and requests
└── Auto-scaling policies
```

---

## 📊 **Performance Architecture**

### **Caching Strategy**
```typescript
Redis Cache Layers:
├── Session Storage:
│   ├── User sessions (JWT refresh tokens)
│   ├── Rate limiting counters
│   └── OAuth state tokens
├── Data Caching:
│   ├── Today's mood (1 hour TTL)
│   ├── Canvas assignments (15 min TTL)
│   ├── Academic stress levels (5 min TTL)
│   └── User profile data (30 min TTL)
└── Computed Results:
    ├── Mood analytics (1 hour TTL)
    ├── Task priorities (15 min TTL)
    └── Stress calculations (5 min TTL)
```

### **Database Optimization**
```sql
Indexing Strategy:
├── Primary Keys: Auto B-tree indexes
├── Foreign Keys: Performance indexes
├── Query Optimization:
│   ├── users.email (unique index)
│   ├── mood_logs.user_id, created_at (composite)
│   ├── tasks.user_id, due_date (composite)
│   ├── assignments.course_id, due_date (composite)
│   └── academic_stress_logs.user_id, created_at (composite)
└── Partitioning Ready:
    ├── mood_logs by month
    ├── academic_stress_logs by month
    └── cross_service_events by week
```

### **API Performance**
```typescript
Optimization Techniques:
├── Response Compression: gzip/brotli
├── Request Validation: Early joi validation
├── Database Queries: Optimized joins and limits
├── Pagination: Cursor-based for large datasets
├── Rate Limiting: Redis-based throttling
└── Error Handling: Structured error responses
```

---

## 🔮 **Future Architecture Considerations**

### **Phase 2B: Sleep Service Architecture**
```typescript
Sleep Service (Port 3006) - Coming Next:
├── Sleep pattern tracking and analysis
├── Sleep-mood-academic correlation algorithms
├── Sleep quality scoring system
├── Integration with existing crisis detection
├── Additional database tables:
│   ├── sleep_logs (sleep duration, quality, patterns)
│   ├── sleep_analytics (correlations, insights)
│   └── sleep_recommendations (personalized advice)
└── Cross-service events:
    ├── SLEEP_QUALITY_POOR → Wellness Service
    ├── SLEEP_ACADEMIC_CORRELATION → Academic Service
    └── SLEEP_CRISIS_RISK → Crisis Detection
```

### **Phase 3: AI Services Architecture**
```python
Python AI Services:
├── LangGraph Agent Orchestration
├── Multi-agent emotional support system
├── RAG (Retrieval Augmented Generation)
├── Natural language processing
├── Predictive analytics
└── Integration with Node.js services via:
    ├── REST APIs
    ├── Message queues (Kafka)
    └── Shared database access
```

### **Phase 4: Mobile Architecture**
```typescript
React Native Mobile App:
├── Shared component library
├── Native device integrations:
│   ├── Biometric authentication
│   ├── Push notifications
│   ├── Background sync
│   └── Offline data storage
├── Real-time synchronization
└── Platform-specific optimizations
```

---

## 🎯 **Architecture Success Metrics**

### **Current Implementation**
- **✅ 3 Microservices** deployed and communicating
- **✅ 21+ Database Tables** with proper relationships
- **✅ Event-Driven Integration** between academic and wellness
- **✅ Canvas OAuth 2.0** integration architecture
- **✅ Type-Safe Development** across all layers
- **✅ Mobile-Responsive Frontend** with state management
- **✅ Security Best Practices** implemented throughout
- **✅ Docker Infrastructure** ready for scaling

### **Scalability Achievements**
- **Microservices Pattern:** Easy to scale individual services
- **Database Design:** Normalized schema with performance indexing
- **Caching Strategy:** Redis for high-performance data access
- **Event Architecture:** Loose coupling for service independence
- **Container Ready:** Docker deployment for any environment

---

**🚀 This architecture provides a solid foundation for a comprehensive mental wellness platform that can scale to serve thousands of students while maintaining performance, security, and reliability.** ✨