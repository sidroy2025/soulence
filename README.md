# 🎓 Soulence - Mental Wellness Platform for Students

A comprehensive mental wellness platform that integrates academic management, emotional support, and holistic health monitoring. Soulence connects academic performance, mood tracking, and wellness support through intelligent AI systems.

## 🌟 **Current Status: Phase 2A Complete**

✅ **Working Demo Available** - Full academic integration with Canvas LMS simulation  
✅ **3 Backend Services** - Auth, Wellness, and Academic services deployed  
✅ **Complete Frontend** - React + TypeScript with responsive design  
✅ **21+ Database Tables** - Full schema with academic integration  

---

## 🚀 **Quick Start (Demo Mode)**

### **Option 1: Use Start Script**
```bash
# Windows - Double-click this file:
start-academic-demo.bat

# Or run manually:
cd frontend/web
npm install
npm run dev
```

### **Option 2: Manual Setup**
```bash
git clone <repository-url>
cd soulence/frontend/web
npm install
npm run dev
```

**🌐 Access:** http://localhost:3000  
**🎭 Demo Login:** Any email/password works in demo mode  
**📱 Navigate to:** Academic section to test new features  

---

## 🏗️ **Architecture Overview**

### **Microservices Architecture**
```
┌──────────────────────────────────────────────────────────────────────┐
│                        SOULENCE PLATFORM                            │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │   React     │  │    Auth     │  │  Wellness   │  │  Academic   │  │
│  │  Frontend   │◄►│  Service    │◄►│  Service    │◄►│  Service    │  │
│  │(Port 3000)  │  │ (Port 3001) │  │ (Port 3002) │  │ (Port 3003) │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│         │                   │              │              │          │
│         │                   ▼              ▼              ▼          │
│         │          ┌─────────────┐    ┌─────────────┐    ┌─────────┐ │
│         │          │ PostgreSQL  │    │   Redis     │    │ Canvas  │ │
│         │          │  Database   │    │   Cache     │    │   LMS   │ │
│         │          │             │    │             │    │   API   │ │
│         │          └─────────────┘    └─────────────┘    └─────────┘ │
│         │                   │              │                        │
│         └───────────────────┼──────────────┼────────────────────────┘
│                             ▼              ▼                        
│                    ┌─────────────┐    ┌─────────────┐              
│                    │   Crisis    │    │  Academic   │              
│                    │ Detection   │    │   Stress    │              
│                    │  System     │    │ Monitoring  │              
│                    └─────────────┘    └─────────────┘              
```

### **Technology Stack**
- **Frontend:** React 18 + TypeScript + Tailwind CSS + Zustand
- **Backend:** Node.js + Express + TypeScript + Microservices
- **Database:** PostgreSQL + Redis + InfluxDB (ready)
- **Integration:** Canvas LMS OAuth 2.0 + REST APIs
- **Infrastructure:** Docker + Docker Compose + Prometheus (ready)

---

## 🎯 **Core Features**

### **✅ Mental Wellness Tracking**
- **Mood Logging:** Interactive 1-10 scale with 15+ emotion categories
- **Crisis Detection:** Automatic alerts for concerning patterns (score ≤ 3)
- **Support Resources:** Professional crisis intervention resources
- **Analytics:** Mood trends, statistics, and historical tracking

### **✅ Academic Management** 
- **Canvas LMS Integration:** OAuth 2.0 connection with assignment sync
- **Task Management:** Create, update, delete, and prioritize tasks
- **Smart Prioritization:** AI-driven ranking by due date, points, and stress
- **Academic Stress Monitoring:** Real-time stress calculation feeding wellness alerts
- **Unified Dashboard:** All assignments and personal tasks in one view

### **✅ Cross-Service Integration**
- **Holistic Monitoring:** Academic stress affects mental health tracking
- **Crisis Prevention:** High academic stress triggers wellness interventions
- **Data Correlation:** Academic performance patterns inform mental health support

### **⏳ Coming Next: Sleep Monitoring**
- Sleep pattern tracking and quality scoring
- Sleep-mood-academic correlation analysis
- Sleep improvement recommendations
- Complete wellness trifecta integration

---

## 🗄️ **Database Schema**

### **Core Tables (15+ tables)**
- `users`, `user_profiles`, `user_consents`
- `mood_logs`, `crisis_alerts`, `symptom_logs`
- `parent_child_links`, `therapist_patient_links`
- `tasks`, `study_routines`, `progress_logs`
- `documents`, `document_chunks`, `quiz_questions`
- `conversation_sessions`, `ai_conversations`, `ai_interactions`

### **Academic Integration Tables (6 new tables)**
- `canvas_connections` - OAuth tokens and connection status
- `courses` - Canvas course synchronization data
- `assignments` - Canvas assignments with priority calculations
- `assignment_submissions` - Grades and submission tracking
- `academic_stress_logs` - Historical stress level monitoring
- `cross_service_events` - Inter-service communication events

---

## 🔧 **Development Setup**

### **Prerequisites**
- Node.js 18+
- Docker & Docker Compose
- Git

### **Full Stack Development**
```bash
# 1. Start Infrastructure
docker-compose up -d postgres redis

# 2. Start Backend Services
docker-compose up auth-service wellness-service academic-service

# 3. Start Frontend
cd frontend/web
npm install
npm run dev
```

### **Canvas Integration Setup (Production)**
```bash
# 1. Create Canvas Developer Key in your institution's Canvas admin
# 2. Configure environment variables:
CANVAS_CLIENT_ID=your_canvas_client_id
CANVAS_CLIENT_SECRET=your_canvas_client_secret
CANVAS_AUTH_URL=https://your-institution.instructure.com/login/oauth2/auth
CANVAS_TOKEN_URL=https://your-institution.instructure.com/login/oauth2/token
CANVAS_API_URL=https://your-institution.instructure.com/api/v1

# 3. Set up OAuth redirect URI:
CANVAS_REDIRECT_URI=http://localhost:3000/canvas/callback
```

---

## 🎭 **Demo Features**

### **Academic Dashboard**
- Overview cards: stress level, total tasks, due today, completion rate
- Canvas connection status with last sync time
- Upcoming tasks preview with priority indicators

### **Task Management**
- **6 Demo Tasks** including Canvas assignments and personal tasks:
  - Math Assignment (Due in 2 days, High Priority, Canvas)
  - History Essay (Due in 5 days, Medium Priority, Canvas)
  - Chemistry Quiz Study (Due tomorrow, High Priority, Manual)
  - Biology Lab Report (Due in 1 week, Medium Priority, Canvas)
  - English Reading (Overdue, Low Priority, Canvas)
  - Call Academic Advisor (Due in 3 days, Low Priority, Manual)

### **Canvas Integration Simulation**
- OAuth connection flow demonstration
- Assignment sync with realistic timing
- Connection/disconnection functionality
- Real-time status updates

### **Stress Monitoring**
- Dynamic stress calculation based on task completion
- Visual stress level indicators (Low/Medium/High)
- Stress history and trend analysis
- Integration with wellness monitoring

---

## 📱 **User Experience**

### **Navigation**
- Consistent header navigation across all pages
- Mobile-responsive design with touch-friendly interfaces
- Real-time notifications and loading states
- Breadcrumb navigation for complex workflows

### **Academic Workflow**
1. **Connect Canvas:** One-click OAuth integration
2. **View Tasks:** Unified dashboard with all assignments
3. **Manage Tasks:** Create, complete, and prioritize
4. **Monitor Stress:** Real-time academic stress tracking
5. **Get Support:** Automatic wellness integration for high stress

---

## 🔐 **Security & Privacy**

- **OAuth 2.0:** Secure Canvas integration with encrypted token storage
- **JWT Authentication:** Stateless, secure session management
- **Input Validation:** Comprehensive data sanitization
- **SQL Injection Prevention:** Parameterized queries throughout
- **Role-Based Access:** Student, Parent, Therapist permissions
- **Data Privacy:** User consent tracking and sharing controls

---

## 🚀 **Production Deployment**

### **Docker Deployment**
```bash
# Build and deploy all services
docker-compose up -d

# Scale specific services
docker-compose up -d --scale academic-service=3
```

### **Environment Configuration**
- Database connection strings
- Redis cache configuration
- Canvas OAuth credentials
- JWT secret keys
- Monitoring and logging setup

### **Monitoring Ready**
- Prometheus metrics collection
- Grafana dashboards
- InfluxDB time-series data
- Elasticsearch logging
- Health check endpoints

---

## 📊 **Current Metrics**

- **21+ Database Tables** fully implemented
- **3 Backend Services** complete with APIs
- **15+ Frontend Components** built and working
- **27+ API Endpoints** implemented
- **Canvas LMS Integration** with OAuth 2.0
- **Academic Stress Monitoring** integrated with wellness
- **Mobile-Responsive Design** across all features
- **Type-Safe Development** with full TypeScript

---

## 🎯 **Next Development Phases**

### **Phase 2B: Sleep Monitoring (1-2 weeks)**
- Sleep Service (Port 3006) implementation
- Sleep pattern tracking and quality scoring
- Sleep-mood-academic correlation analysis
- Integration with crisis detection system

### **Phase 3: AI Integration (1-2 months)**
- Python-based AI services with LangGraph
- Multi-agent emotional support system
- RAG document processing for assignments
- Advanced stress prediction algorithms

### **Phase 4: Professional Tools (2-4 months)**
- Care service for therapists and counselors
- Parent/guardian dashboard and notifications
- Advanced reporting and analytics
- Data sharing and privacy controls

---

## 💡 **Key Innovations**

1. **Holistic Integration:** Academic stress directly influences mental health monitoring
2. **Smart Prioritization:** AI-driven task management based on multiple stress factors
3. **Real-time Sync:** 15-minute Canvas assignment synchronization
4. **Cross-Service Events:** Seamless communication between wellness and academic systems
5. **Crisis Prevention:** Early detection of academic-related mental health concerns

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 **Additional Documentation**

- **[STATUS.md](STATUS.md)** - Current development status and roadmap
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed technical architecture
- **[soulence_functional_specs.md](soulence_functional_specs.md)** - Complete feature specifications

---

**🎉 Soulence: Where academic success meets mental wellness through intelligent technology.** 🚀✨