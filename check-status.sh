#!/bin/bash

echo "🧪 CHECKING HAIRDRESSER SCHEDULER STATUS"
echo "========================================"
echo ""

# Check if scheduler is running
if [ -f "/Users/danieloostdam/Desktop/hairdresser-scheduler/scheduler.pid" ]; then
    PID=$(cat /Users/danieloostdam/Desktop/hairdresser-scheduler/scheduler.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "✅ Scheduler is running (PID: $PID)"
        echo ""
        echo "📊 Process details:"
        ps -p $PID -o pid,ppid,user,command
    else
        echo "❌ Scheduler PID file exists but process is not running"
    fi
else
    echo "❌ Scheduler is not running (no PID file)"
fi

echo ""
echo "📅 Recent activity from log (last 10 lines):"
echo "-------------------------------------------"
tail -10 /Users/danieloostdam/Desktop/hairdresser-scheduler/scheduler.log 2>/dev/null || echo "No log file found"

echo ""
echo "🔍 Current status:"
cd /Users/danieloostdam/Desktop/hairdresser-scheduler/
node hairdresser-scheduler-fixed-final.js status 2>&1