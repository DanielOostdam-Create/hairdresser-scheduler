#!/bin/bash

echo "🚀 Hairdresser Scheduler with Notifications"
echo "==========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "puppeteer-scheduler-notify.js" ]; then
    echo "❌ Error: Please run this script from the hairdresser-scheduler directory"
    exit 1
fi

# Function to check if notifications are configured
check_notifications() {
    if [ -f "notification-config.json" ]; then
        echo "✅ Notifications configured"
        return 0
    else
        echo "⚠️ Notifications not configured yet"
        return 1
    fi
}

# Function to start the scheduler with notifications
start_scheduler() {
    echo "🔄 Starting hairdresser scheduler with notifications..."
    echo "📅 Checking for appointments every hour"
    echo "🔔 You'll receive notifications when appointments are available"
    echo ""
    echo "Press Ctrl+C to stop"
    echo ""
    
    # Use nohup to run in background if needed
    if [ "$1" = "background" ]; then
        echo "🔧 Starting in background mode..."
        nohup node puppeteer-scheduler-notify.js start > scheduler.log 2>&1 &
        echo "✅ Scheduler started in background (PID: $!)"
        echo "📝 Check logs with: tail -f scheduler.log"
        echo "🛑 Stop with: pkill -f puppeteer-scheduler-notify"
    else
        node puppeteer-scheduler-notify.js start
    fi
}

# Main menu
case "$1" in
    "setup")
        echo "🔧 Running notification setup..."
        node setup-notifications.js
        ;;
    "start")
        if check_notifications; then
            start_scheduler
        else
            echo ""
            echo "💡 Run setup first: ./start-scheduler.sh setup"
        fi
        ;;
    "background")
        if check_notifications; then
            start_scheduler background
        else
            echo ""
            echo "💡 Run setup first: ./start-scheduler.sh setup"
        fi
        ;;
    "stop")
        echo "🛑 Stopping scheduler..."
        pkill -f puppeteer-scheduler-notify
        echo "✅ Scheduler stopped"
        ;;
    "status")
        node puppeteer-scheduler-notify.js status
        ;;
    "test")
        echo "🧪 Testing notifications..."
        node puppeteer-scheduler-notify.js test-notifications
        ;;
    "logs")
        if [ -f "scheduler.log" ]; then
            echo "📝 Showing recent logs..."
            tail -20 scheduler.log
        else
            echo "❌ No log file found"
        fi
        ;;
    "earliest")
        echo "🔍 Finding earliest available appointment..."
        node puppeteer-scheduler-notify.js earliest
        ;;
    *)
        echo "🔧 Hairdresser Scheduler with Notifications"
        echo ""
        echo "Usage: ./start-scheduler.sh <command>"
        echo ""
        echo "Commands:"
        echo "  setup         Setup email/push notifications"
        echo "  start         Start hourly monitoring (interactive)"
        echo "  background    Start in background mode"
        echo "  stop          Stop background scheduler"
        echo "  status        Show current status"
        echo "  test          Test notifications"
        echo "  logs          Show recent logs (background mode)"
        echo "  earliest      Find earliest available appointment"
        echo ""
        echo "First time setup:"
        echo "1. ./start-scheduler.sh setup"
        echo "2. ./start-scheduler.sh start"
        echo ""
        echo "For background operation:"
        echo "1. ./start-scheduler.sh background"
        echo "2. ./start-scheduler.sh logs (to check progress)"
        echo "3. ./start-scheduler.sh stop (when done)"
        ;;
esac