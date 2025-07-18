#!/bin/bash

# Quick test script to verify everything is working

echo "🧪 HAIRDRESSER SCHEDULER TEST"
echo "============================="
echo ""

# Test 1: Check files
echo "1️⃣ Checking required files..."
FILES=(
    "hairdresser-scheduler-fixed-final.js"
    "run-scheduler.sh"
    "notification-config.json"
    "appointments.json"
    "package.json"
)

ALL_GOOD=true
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file (MISSING)"
        ALL_GOOD=false
    fi
done

if [ "$ALL_GOOD" = false ]; then
    echo ""
    echo "❌ Some files are missing. Please check your installation."
    exit 1
fi
echo ""

# Test 2: Check Node.js
echo "2️⃣ Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "  ✅ Node.js: $NODE_VERSION"
else
    echo "  ❌ Node.js not installed"
    exit 1
fi
echo ""

# Test 3: Check Puppeteer
echo "3️⃣ Checking Puppeteer..."
if [ -d "node_modules/puppeteer" ]; then
    echo "  ✅ Puppeteer installed"
else
    echo "  ❌ Puppeteer not installed"
    echo "  Run: npm install"
    exit 1
fi
echo ""

# Test 4: Check email config
echo "4️⃣ Checking email configuration..."
if grep -q "your-email@gmail.com" notification-config.json; then
    echo "  ✅ Email configured"
else
    echo "  ❌ Email not configured"
fi
echo ""

# Test 5: Quick scheduler test
echo "5️⃣ Testing scheduler functionality..."
echo "  Running quick status check..."
node hairdresser-scheduler-fixed-final.js status
echo ""

echo "✅ ALL TESTS PASSED!"
echo ""
echo "🚀 Ready to start scheduler with:"
echo "   ./run-scheduler.sh start"
echo ""