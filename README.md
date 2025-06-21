# Soulence - Mental Wellness App for Students

A comprehensive mental wellness platform designed specifically for students, featuring AI-powered support, academic task management, and emotional well-being tracking.

## 🏗️ Architecture Overview

Soulence follows a microservices architecture with the following components:

- **Frontend**: React Native (mobile) + React.js (web)
- **Backend**: Node.js microservices with TypeScript
- **AI/ML**: Python-based services with LangGraph agents
- **Databases**: PostgreSQL, Redis, InfluxDB, Pinecone
- **Infrastructure**: Docker, Kubernetes, Prometheus/Grafana

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd soulence
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start Infrastructure

```bash
# Start all services with Docker Compose
docker-compose up -d

# Or start individual services
docker-compose up postgres redis influxdb
```

### 3. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Or install for specific services
cd backend/services/auth && npm install
```

### 4. Run Services

```bash
# Development mode
npm run dev:backend

# Or run specific services
cd backend/services/auth && npm run dev
```

## 📋 Services Overview

### Core Services

1. **Authentication Service** (Port 3001)
   - User registration/login
   - JWT token management
   - Role-based access control (Student, Parent, Therapist)

2. **Wellness Service** (Port 3002) - Soulence Calm
   - Mood logging and tracking
   - AI-powered emotional support buddy
   - Crisis detection and alerts

3. **Academic Service** (Port 3003) - Soulence Focus
   - Task and assignment management
   - Study routine optimization
   - Progress tracking

4. **Learning Service** (Port 3004) - Soulence Learn
   - RAG-based document processing
   - AI-powered Q&A and quiz generation
   - LangGraph agent orchestration

5. **Care Service** (Port 3005) - Soulence Care
   - Mental health insights
   - Report generation for therapists
   - Data sharing management

### Infrastructure Services

- **PostgreSQL** (Port 5432): Primary database
- **Redis** (Port 6379): Cache and session storage
- **InfluxDB** (Port 8086): Time-series data for mood tracking
- **Kafka** (Port 9092): Event streaming for agent communication
- **MinIO** (Port 9000): S3-compatible object storage
- **Elasticsearch** (Port 9200): Logging and search
- **Prometheus** (Port 9090): Metrics collection
- **Grafana** (Port 3000): Monitoring dashboards

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Core
NODE_ENV=development
JWT_SECRET=your-secret-key

# Databases
DB_HOST=localhost
DB_PASSWORD=your-password
REDIS_URL=redis://localhost:6379

# AI Services
OPENAI_API_KEY=your-openai-key
PINECONE_API_KEY=your-pinecone-key

# AWS (for S3 storage)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## 🏭 Database Schema

The application uses PostgreSQL with the following main tables:

- `users`: Core user accounts
- `mood_logs`: Emotional state tracking
- `tasks`: Academic task management
- `documents`: Uploaded learning materials
- `ai_interactions`: AI conversation history
- `engagement_signals`: Passive feedback for AI improvement

Run the schema setup:

```bash
psql -h localhost -U postgres -d soulence -f database/schema.sql
```

## 🤖 AI/ML Features

### LangGraph Agent System

The learning service implements a sophisticated multi-agent system:

1. **Query Processing Agent**: Analyzes and processes student queries
2. **Response Generation Agent**: Creates contextual, educational responses
3. **Quality Validation Agent**: Ensures response quality and safety
4. **Engagement Monitoring Agent**: Tracks student engagement passively
5. **Adaptive Learning Agent**: Improves responses based on feedback
6. **Knowledge Base Agent**: Maintains and enhances the learning database

### Passive Feedback Loop

- **Engagement Signals**: Completion rates, retry patterns, session duration
- **Quality Metrics**: Response effectiveness, user satisfaction estimation
- **Adaptive Improvements**: Real-time response optimization

## 📱 Frontend Applications

### Mobile App (React Native)

```bash
cd mobile
npm install
npx react-native run-ios    # iOS
npx react-native run-android # Android
```

### Web App (React)

```bash
cd frontend/web
npm install
npm run dev
```

## 🔐 Security Features

- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Authentication**: JWT with refresh token rotation
- **Authorization**: Role-based access control (RBAC)
- **Privacy**: GDPR/HIPAA compliance features
- **Crisis Detection**: AI-powered mental health crisis alerts

## 📊 Monitoring & Observability

### Metrics (Prometheus + Grafana)

- Application performance metrics
- Business metrics (mood logs, crisis alerts)
- Infrastructure health

### Logging (ELK Stack)

- Structured logging with Winston
- Centralized log aggregation
- Real-time log analysis

### Health Checks

All services expose `/health` endpoints for monitoring.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific service
cd backend/services/auth && npm test

# Run e2e tests
npm run test:e2e
```

## 🚀 Deployment

### Docker

```bash
# Build all services
docker-compose build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Monitor deployment
kubectl get pods -n soulence
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Documentation: [Link to docs]
- Issues: [GitHub Issues]
- Email: support@soulence.app

## 🗺️ Roadmap

- [ ] Complete core microservices
- [ ] Implement LangGraph agent system
- [ ] Build mobile and web frontends
- [ ] Add real-time notifications
- [ ] Implement advanced AI features
- [ ] Deploy to production infrastructure