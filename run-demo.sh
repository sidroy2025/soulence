#!/bin/bash

echo "🚀 Starting Soulence Demo"
echo "========================"
echo ""
echo "✨ What you'll see:"
echo "   • Complete React frontend with interactive UI"
echo "   • Mood logging with 1-10 scale and emotions"
echo "   • Crisis detection for low mood scores"
echo "   • Dashboard with mood analytics"
echo "   • Crisis support resources"
echo "   • Mobile-responsive design"
echo ""
echo "🎭 Demo Features:"
echo "   • Login with any email/password"
echo "   • Pre-loaded demo mood data"
echo "   • Mock API responses"
echo "   • All UI interactions working"
echo ""
echo "📱 The app will open at: http://localhost:3000"
echo ""
echo "💡 To stop the demo, press Ctrl+C"
echo ""

# Check if we're in the right directory
if [ ! -f "/mnt/c/projects/soulence/frontend/web/package.json" ]; then
    echo "❌ Error: Please run this script from the Soulence project root"
    exit 1
fi

# Navigate to frontend directory and start
cd /mnt/c/projects/soulence/frontend/web

# Start the development server
echo "🌐 Starting React development server..."
npm run dev

echo ""
echo "👋 Demo ended. Thanks for trying Soulence!"