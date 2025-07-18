#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function resetScheduler() {
    const dataFile = path.join(__dirname, 'appointments.json');
    
    console.log('🧹 Resetting scheduler data...');
    
    try {
        // Load current data
        const data = JSON.parse(await fs.readFile(dataFile, 'utf8'));
        
        // Keep only essential data, clear error notifications
        const cleanData = {
            lastAppointment: data.lastAppointment,
            nextAppointment: data.nextAppointment,
            targetDate: data.targetDate,
            targetWeek: data.targetWeek,
            lastChecked: new Date().toISOString(),
            notifications: []
        };
        
        // Save cleaned data
        await fs.writeFile(dataFile, JSON.stringify(cleanData, null, 2));
        
        console.log('✅ Scheduler data reset successfully!');
        console.log('📅 Target date:', cleanData.targetDate);
        console.log('📆 Target week:', cleanData.targetWeek);
        console.log('🗑️ Cleared all error notifications');
        console.log('');
        console.log('🚀 Ready to start fresh with:');
        console.log('   ./run-scheduler.sh start');
        
    } catch (error) {
        console.error('❌ Error resetting data:', error.message);
    }
}

if (require.main === module) {
    resetScheduler();
}