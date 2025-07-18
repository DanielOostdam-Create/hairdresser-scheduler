#!/bin/bash

# Simple Background Runner for Robust Hairdresser Scheduler

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
LOG_FILE="$SCRIPT_DIR/scheduler.log"
PID_FILE="$SCRIPT_DIR/scheduler.pid"
SCHEDULER_SCRIPT="$SCRIPT_DIR/hairdresser-scheduler-fixed-final.js"

# Check if running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    else
        return 1
    fi
}

# Start scheduler
start_scheduler() {
    if is_running; then
        echo "✅ Scheduler already running (PID: $(cat $PID_FILE))"
        return 0
    fi

    echo "🚀 Starting robust scheduler in background..."
    echo "📝 Logs: $LOG_FILE"
    
    nohup node "$SCHEDULER_SCRIPT" start >> "$LOG_FILE" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    sleep 3
    if is_running; then
        echo "✅ Started successfully (PID: $pid)"
        echo "📊 Check status: $0 status"
        echo "📝 View logs: $0 logs"
        echo "🛑 Stop: $0 stop"
    else
        echo "❌ Failed to start"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Stop scheduler
stop_scheduler() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo "🛑 Stopping scheduler (PID: $pid)..."
        kill -TERM "$pid" 2>/dev/null
        
        for i in {1..10}; do
            if ! is_running; then
                echo "✅ Stopped gracefully"
                rm -f "$PID_FILE"
                return 0
            fi
            sleep 1
        done
        
        echo "⚠️ Force stopping..."
        kill -KILL "$pid" 2>/dev/null
        rm -f "$PID_FILE"
        echo "✅ Force stopped"
    else
        echo "⚠️ Not running"
    fi
}

# Show status
show_status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo "✅ Running (PID: $pid)"
        echo ""
        node "$SCHEDULER_SCRIPT" status
    else
        echo "❌ Not running"
    fi
}

# Show logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📝 Recent activity:"
        echo "=================="
        tail -20 "$LOG_FILE"
    else
        echo "❌ No log file found"
    fi
}

# Monitor logs
monitor_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "📝 Monitoring logs (Ctrl+C to exit):"
        tail -f "$LOG_FILE"
    else
        echo "❌ No log file. Start scheduler first: $0 start"
    fi
}

case "$1" in
    start)
        start_scheduler
        ;;
    stop)
        stop_scheduler
        ;;
    restart)
        stop_scheduler
        sleep 2
        start_scheduler
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    monitor)
        monitor_logs
        ;;
    test)
        echo "🧪 Testing notifications..."
        node "$SCHEDULER_SCRIPT" test
        ;;
    earliest)
        echo "🔍 Finding earliest appointment..."
        node "$SCHEDULER_SCRIPT" earliest
        ;;
    check)
        echo "🔍 One-time check..."
        node "$SCHEDULER_SCRIPT" check
        ;;
    *)
        echo "🔧 Robust Hairdresser Scheduler Runner"
        echo "======================================"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  start     Start in background"
        echo "  stop      Stop background process"
        echo "  restart   Restart scheduler"
        echo "  status    Show current status"
        echo "  logs      Show recent logs"
        echo "  monitor   Monitor logs in real-time"
        echo "  test      Test notifications"
        echo "  earliest  Find earliest appointment"
        echo "  check     One-time availability check"
        echo ""
        echo "🚀 Quick Start:"
        echo "1. $0 start    # Start monitoring"
        echo "2. $0 status   # Check if working"
        echo "3. $0 monitor  # Watch activity"
        echo "4. $0 stop     # Stop when done"
        echo ""
        echo "🛡️ This version fixes all connection issues!"
        ;;
esac