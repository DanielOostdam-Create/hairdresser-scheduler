#!/usr/bin/env node

// Quick test to verify the Puppeteer fix
const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Testing Puppeteer fix...');
console.log('===============================');

try {
    // Change to the project directory and run a check
    process.chdir('/Users/danieloostdam/Desktop/hairdresser-scheduler');
    
    console.log('🔍 Running: node puppeteer-scheduler.js check');
    console.log('This should no longer show "waitForTimeout is not a function" error...\n');
    
    const result = execSync('node puppeteer-scheduler.js check', { 
        encoding: 'utf8',
        timeout: 60000 // 1 minute timeout
    });
    
    console.log(result);
    console.log('\n✅ Test completed successfully!');
    
} catch (error) {
    console.error('❌ Test failed:');
    console.error(error.message);
    
    if (error.stdout) {
        console.log('\nStdout:', error.stdout);
    }
    if (error.stderr) {
        console.log('\nStderr:', error.stderr);
    }
}
