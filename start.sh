#!/bin/bash

# MessMate Server Startup Script
# This script starts the MessMate server properly

echo "🚀 Starting MessMate Server..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the mess directory
cd "$SCRIPT_DIR"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any process running on port 3000
PORT=3000
PID=$(lsof -ti:$PORT)
if [ ! -z "$PID" ]; then
    echo "⚠️  Port $PORT is already in use. Killing process $PID..."
    kill -9 $PID
    sleep 1
fi

# Start the server
echo "✅ Starting server on http://localhost:$PORT"
echo ""
echo "📋 Available pages:"
echo "   • http://localhost:$PORT/index.html (Login)"
echo "   • http://localhost:$PORT/dashboard.html (Student Dashboard)"
echo "   • http://localhost:$PORT/admin_dashboard.html (Admin Dashboard)"
echo "   • http://localhost:$PORT/book_meals.html (Book Meals)"
echo "   • http://localhost:$PORT/profile.html (Profile)"
echo "   • http://localhost:$PORT/transactions.html (Transactions)"
echo "   • http://localhost:$PORT/settings.html (Settings)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

node server.js
