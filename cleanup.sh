#!/bin/bash

echo "🧹 Cleaning up old scheduler files..."
echo "Keeping only the essential robust version"
echo ""

# Files to keep (essential)
KEEP_FILES=(
    "hairdresser-scheduler-fixed-final.js"
    "run-scheduler.sh"
    "notification-config.json"
    "appointments.json"
    "package.json"
    "package-lock.json"
    "node_modules"
)

# Move old files to backup directory
BACKUP_DIR="old-versions-backup"
mkdir -p "$BACKUP_DIR"

echo "📦 Moving old files to $BACKUP_DIR/"

# List of old files to archive
OLD_FILES=(
    "puppeteer-scheduler.js"
    "puppeteer-scheduler-notify.js"
    "puppeteer-scheduler-robust.js"
    "puppeteer-scheduler-fixed.js"
    "hairdresser-scheduler.js"
    "hairdresser-scheduler-final.js"
    "hairdresser-scheduler-fixed.js"
    "notification-manager.js"
    "setup-notifications.js"
    "setup-puppeteer.js"
    "start-scheduler.sh"
    "start.sh"
    "make-ready.js"
    "debug-*.js"
    "test-*.js"
    "install-*.js"
    "inspect-content.js"
    "show-content.js"
    "*.md"
    "package-puppeteer.json"
)

for pattern in "${OLD_FILES[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "  📄 $file"
            mv "$file" "$BACKUP_DIR/"
        fi
    done
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📂 Current directory now contains:"
ls -la | grep -E '\.(js|json|sh)$' | grep -v "$BACKUP_DIR"
echo ""
echo "🚀 Ready to use the robust scheduler:"
echo "  chmod +x run-scheduler.sh"
echo "  ./run-scheduler.sh start"
echo ""
echo "📦 Old files archived in: $BACKUP_DIR/"