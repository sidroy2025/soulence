#!/bin/bash

echo "Starting Soulence Services..."

# Export environment variables
export NODE_ENV=development
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=soulence
export DB_USER=postgres
export DB_PASSWORD=soulence123
export REDIS_URL=redis://localhost:6379
export JWT_SECRET=test-secret-key-123
export AUTH_SERVICE_PORT=3001
export WELLNESS_SERVICE_PORT=3002

# Check if PostgreSQL and Redis are running
echo "Checking database connections..."
docker ps | grep -q soulence-postgres || echo "Warning: PostgreSQL container not running"
docker ps | grep -q soulence-redis || echo "Warning: Redis container not running"

# Function to start a service
start_service() {
    SERVICE_NAME=$1
    SERVICE_PATH=$2
    SERVICE_PORT=$3
    
    echo "Starting $SERVICE_NAME on port $SERVICE_PORT..."
    cd "$SERVICE_PATH"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies for $SERVICE_NAME..."
        npm install
    fi
    
    # Start the service
    npx ts-node src/index.ts &
    echo "$SERVICE_NAME started with PID $!"
}

# Start Auth Service
# start_service "Auth Service" "/mnt/c/projects/soulence/backend/services/auth" 3001

# Start Wellness Service
# start_service "Wellness Service" "/mnt/c/projects/soulence/backend/services/wellness" 3002

echo "To start services individually, uncomment the start_service lines above"
echo "Press Ctrl+C to stop all services"

# Keep script running
wait