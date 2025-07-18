#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔄 Installing Fixed Hairdresser Scheduler');
console.log('=========================================');
console.log('');

const originalFile = 'hairdresser-scheduler.js';
const fixedFile = 'hairdresser-scheduler-fixed.js';
const backupFile = 'hairdresser-scheduler-original-backup.js';

try {
    // Check if files exist
    if (!fs.existsSync(fixedFile)) {
        console.log('❌ Fixed file not found. Make sure hairdresser-scheduler-fixed.js exists.');
        process.exit(1);
    }
    
    if (!fs.existsSync(originalFile)) {
        console.log('❌ Original file not found. Make sure hairdresser-scheduler.js exists.');
        process.exit(1);
    }
    
    // Create backup of original
    console.log('📦 Creating backup of original file...');
    fs.copyFileSync(originalFile, backupFile);
    console.log(`✅ Backup saved as: ${backupFile}`);
    
    // Replace original with fixed version
    console.log('🔄 Installing fixed version...');
    fs.copyFileSync(fixedFile, originalFile);
    console.log(`✅ Fixed version installed as: ${originalFile}`);
    
    console.log('');
    console.log('🎉 Installation complete!');
    console.log('');
    console.log('📋 What changed:');
    console.log('• ✅ Improved HTML parsing for Dutch Calendly interface');
    console.log('• ✅ Added multi-month checking capability');
    console.log('• ✅ Better error handling and diagnostics');
    console.log('• ✅ More accurate date detection');
    console.log('');
    console.log('🚀 Ready to test! Try these commands:');
    console.log('  node hairdresser-scheduler.js check     # Test availability check');
    console.log('  node hairdresser-scheduler.js earliest  # Find earliest appointment');
    console.log('  node hairdresser-scheduler.js start     # Start monitoring');
    console.log('');
    console.log('🔧 If you need to revert:');
    console.log(`  cp ${backupFile} ${originalFile}`);
    
} catch (error) {
    console.error('❌ Error during installation:', error.message);
    process.exit(1);
}
