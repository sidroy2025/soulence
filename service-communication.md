# Service Communication Flow

## How Microservices Communicate in Soulence

### 1. User Registration Flow
```
User (Mobile/Web App)
    |
    | POST /api/v1/auth/register
    | {email, password, role}
    ↓
Auth Service (Port 3001)
    |
    ├─→ Validate input
    ├─→ Hash password
    ├─→ Save to PostgreSQL
    ├─→ Generate JWT token
    └─→ Return token + user info
```

### 2. Mood Logging Flow
```
User (with JWT token)
    |
    | POST /api/v1/mood
    | Headers: Authorization: Bearer <token>
    | Body: {moodScore: 7, emotions: [...]}
    ↓
Wellness Service (Port 3002)
    |
    ├─→ Validate JWT token (internal)
    ├─→ Extract user ID from token
    ├─→ Save mood to PostgreSQL
    ├─→ Cache in Redis
    ├─→ Check for crisis (score ≤ 3)
    │   └─→ Trigger notifications
    └─→ Return confirmation
```

### 3. Service-to-Service Communication
```
Wellness Service needs user details:
    |
    | GET /api/v1/users/{userId}
    | Headers: Authorization: Bearer <service-token>
    ↓
Auth Service
    |
    ├─→ Validate request
    ├─→ Query user data
    └─→ Return user profile

```

## Key Concepts Demonstrated:

### 1. **JWT Token Flow**
- User logs in → Auth Service generates JWT
- JWT contains: `{userId, role, permissions, exp}`
- Other services validate JWT without calling Auth Service
- Token is stateless - contains all needed info

### 2. **Database Strategy**
```
PostgreSQL (Shared Database)
├── Auth Service Tables
│   ├── users
│   ├── user_profiles
│   └── user_consents
├── Wellness Service Tables
│   ├── mood_logs
│   ├── crisis_alerts
│   └── symptom_logs
└── Academic Service Tables
    ├── tasks
    └── study_sessions
```

### 3. **Caching Strategy**
```
Redis Cache
├── Session Tokens
│   └── refresh_token:{userId}:{token}
├── Temporary Data
│   └── mood:today:{userId}
└── Rate Limiting
    └── rate_limit:{ip}:{endpoint}
```

### 4. **Error Handling**
```
Service A → Service B
    |
    ├─→ Success (200-299)
    ├─→ Client Error (400-499)
    │   └─→ Return error to user
    └─→ Server Error (500-599)
        └─→ Retry with backoff
```

## Testing the Services Locally

### Option 1: Using curl
```bash
# 1. Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@student.com","password":"Test123!","role":"student"}'

# 2. Login (get token)
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@student.com","password":"Test123!"}' \
  | jq -r '.data.accessToken')

# 3. Log mood
curl -X POST http://localhost:3002/api/v1/mood \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"moodScore":8,"emotions":["happy","excited"]}'
```

### Option 2: Using Postman
1. Import the collection from `docs/postman/soulence.json`
2. Set environment variable `{{token}}` after login
3. Run requests in sequence

### Option 3: Using the test script
```bash
node test-api.js
```

## Monitoring Service Health

Each service exposes a health endpoint:
- Auth Service: http://localhost:3001/health
- Wellness Service: http://localhost:3002/health
- Academic Service: http://localhost:3003/health

These return:
```json
{
  "status": "healthy",
  "service": "wellness-service",
  "timestamp": "2024-01-15T10:30:00Z"
}
```