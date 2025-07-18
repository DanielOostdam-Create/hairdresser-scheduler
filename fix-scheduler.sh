#!/bin/bash

# Fix Scheduler Script
# This script fixes common issues and ensures the scheduler runs properly

echo "🔧 HAIRDRESSER SCHEDULER FIX SCRIPT"
echo "==================================="
echo ""

# Check if we're in the right directory
if [ ! -f "hairdresser-scheduler-fixed-final.js" ]; then
    echo "❌ Error: Not in the hairdresser-scheduler directory"
    echo "Please run this from: /Users/danieloostdam/Desktop/hairdresser-scheduler/"
    exit 1
fi

echo "📍 Working directory: $(pwd)"
echo ""

# Step 1: Make scripts executable
echo "1️⃣ Making scripts executable..."
chmod +x run-scheduler.sh
chmod +x cleanup.sh
chmod +x reset-scheduler.js
echo "✅ Scripts are now executable"
echo ""

# Step 2: Check Node.js
echo "2️⃣ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js installed: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi
echo ""

# Step 3: Check dependencies
echo "3️⃣ Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 4: Reset scheduler data
echo "4️⃣ Resetting scheduler data..."
node reset-scheduler.js
echo ""

# Step 5: Test notification system
echo "5️⃣ Testing notification system..."
echo "Sending test email..."
node hairdresser-scheduler-fixed-final.js test
echo ""

# Step 6: Show status
echo "6️⃣ Current scheduler status:"
node hairdresser-scheduler-fixed-final.js status
echo ""

echo "✅ SETUP COMPLETE!"
echo "=================="
echo ""
echo "🚀 To start the scheduler, run:"
echo "   ./run-scheduler.sh start"
echo ""
echo "📊 To check status:"
echo "   ./run-scheduler.sh status"
echo ""
echo "📝 To monitor logs:"
echo "   ./run-scheduler.sh monitor"
echo ""
echo "🛑 To stop:"
echo "   ./run-scheduler.sh stop"
echo ""
echo "💡 The scheduler will:"
echo "   • Check Calendly every hour"
echo "   • Send email when target week (July 7-13) is available"
echo "   • Alert for appointments within 7 days"
echo "   • Automatically recover from connection errors"
echo ""