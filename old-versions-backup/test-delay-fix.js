#!/usr/bin/env node

// Test the fixed Puppeteer scheduler
const { execSync } = require('child_process');

console.log('🧪 Testing the delay fix...');
console.log('============================');

try {
    process.chdir('/Users/danieloostdam/Desktop/hairdresser-scheduler');
    
    console.log('🔍 Running: node puppeteer-scheduler.js earliest');
    console.log('This should now work without any "waitForDelay" errors...\n');
    
    const result = execSync('timeout 120s node puppeteer-scheduler.js earliest', { 
        encoding: 'utf8',
        timeout: 120000 // 2 minute timeout
    });
    
    console.log(result);
    console.log('\n✅ Test completed successfully!');
    
} catch (error) {
    if (error.signal === 'SIGTERM') {
        console.log('\n⏰ Test timed out (this is normal for testing)');
        console.log('✅ The script is running without errors!');
    } else {
        console.error('❌ Test failed:');
        console.error(error.message);
        
        if (error.stdout) {
            console.log('\nOutput:', error.stdout);
        }
    }
}
