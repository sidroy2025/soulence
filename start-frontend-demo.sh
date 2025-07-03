#!/bin/bash

echo "🚀 Starting Soulence Frontend Demo"
echo "================================="

# Check if dependencies are installed
if [ ! -d "/mnt/c/projects/soulence/frontend/web/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm --prefix /mnt/c/projects/soulence/frontend/web install
fi

# Set environment variables for demo
export NODE_ENV=development
export VITE_API_URL=http://localhost:3001

echo ""
echo "🌐 Frontend will start on: http://localhost:3000"
echo "⚠️  Note: Backend services are simulated for this demo"
echo ""
echo "📱 You can test:"
echo "   • User interface and navigation"
echo "   • Mood picker interactions"
echo "   • Form validation"
echo "   • Responsive design"
echo ""
echo "💡 To stop the server, press Ctrl+C"
echo ""

# Start the frontend development server
cd /mnt/c/projects/soulence/frontend/web
npm run dev