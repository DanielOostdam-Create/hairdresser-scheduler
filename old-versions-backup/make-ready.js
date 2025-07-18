#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Making start-scheduler.sh executable...');

try {
    // Make the shell script executable
    if (fs.existsSync('./start-scheduler.sh')) {
        execSync('chmod +x start-scheduler.sh');
        console.log('✅ start-scheduler.sh is now executable');
    }
    
    console.log('\n🎉 HAIRDRESSER SCHEDULER WITH NOTIFICATIONS READY!');
    console.log('==================================================');
    console.log('');
    console.log('🚀 QUICK START:');
    console.log('1. ./start-scheduler.sh setup    # Set up notifications (first time)');
    console.log('2. ./start-scheduler.sh start    # Start hourly monitoring');
    console.log('');
    console.log('📱 NOTIFICATION OPTIONS:');
    console.log('• Email notifications (Gmail/any SMTP)');
    console.log('• Push notifications (Pushover app - $5 one-time)');
    console.log('• Both email and push together');
    console.log('');
    console.log('🔄 HOW IT WORKS:');
    console.log('• Checks Calendly every hour using browser automation');
    console.log('• Looks for appointments in your target week (6 weeks after last appointment)');
    console.log('• Sends you instant notifications when appointments become available');
    console.log('• Continues monitoring until you book an appointment');
    console.log('');
    console.log('⚡ OTHER COMMANDS:');
    console.log('• ./start-scheduler.sh earliest  # Find earliest available appointment now');
    console.log('• ./start-scheduler.sh background # Run in background mode');
    console.log('• ./start-scheduler.sh status    # Check current status');
    console.log('• ./start-scheduler.sh test      # Test your notifications');
    console.log('• ./start-scheduler.sh stop      # Stop background monitoring');
    console.log('');
    console.log('🎯 Ready to get your hairdresser appointments automatically!');
    console.log('');
    
} catch (error) {
    console.error('❌ Error:', error.message);
}
