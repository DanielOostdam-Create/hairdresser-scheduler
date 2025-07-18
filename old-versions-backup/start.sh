#!/bin/bash

echo "🚀 Hairdresser Appointment Scheduler"
echo "===================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Navigate to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Show current status first
echo "📊 Current Status:"
node hairdresser-scheduler.js status

echo ""
echo "Select an option:"
echo "1) Start continuous monitoring (hourly checks)"
echo "2) Check availability once"
echo "3) Check earliest available appointment"
echo "4) View detailed status"
echo "5) Update last appointment date"
echo "6) Set next appointment date"
echo "7) Exit"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo ""
        echo "🔄 Starting continuous monitoring..."
        echo "Press Ctrl+C to stop"
        echo ""
        node hairdresser-scheduler.js start
        ;;
    2)
        echo ""
        echo "🔍 Checking availability once..."
        node hairdresser-scheduler.js check
        ;;
    3)
        echo ""
        echo "⚡ Checking earliest available appointment..."
        node hairdresser-scheduler.js earliest
        ;;
    4)
        echo ""
        node hairdresser-scheduler.js status
        ;;
    5)
        read -p "Enter last appointment date (YYYY-MM-DD): " last_date
        node hairdresser-scheduler.js set-last "$last_date"
        ;;
    6)
        read -p "Enter next appointment date (YYYY-MM-DD): " next_date
        node hairdresser-scheduler.js set-next "$next_date"
        ;;
    7)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac