#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function testCalendlyConnection() {
    console.log('🔧 Testing Calendly Connection');
    console.log('===============================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching Calendly page...');
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`✅ Successfully fetched page (${html.length} characters)`);
        console.log('');
        
        console.log('🔍 Analyzing page content...');
        const availableDates = scheduler.parseAvailableDates(html);
        
        console.log(`📅 Found ${availableDates.length} potential dates`);
        
        if (availableDates.length > 0) {
            console.log('');
            console.log('📋 Available dates found:');
            availableDates.slice(0, 20).forEach(date => {
                console.log(`  • ${date}`);
            });
            
            if (availableDates.length > 20) {
                console.log(`  ... and ${availableDates.length - 20} more`);
            }
        } else {
            console.log('⚠️  No dates found in the expected format');
            console.log('');
            console.log('📄 Page preview (first 500 characters):');
            console.log('----------------------------------------');
            console.log(html.substring(0, 500) + '...');
            console.log('----------------------------------------');
        }
        
        // Check if target week is available
        const data = await scheduler.loadData();
        if (data) {
            const weekAvailability = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
            const earliestInfo = scheduler.findEarliestAvailable(availableDates);
            
            console.log('');
            console.log(`🎯 Target week (${weekAvailability.weekStart} to ${weekAvailability.weekEnd}):`);
            if (weekAvailability.available) {
                console.log(`✅ AVAILABLE! Found ${weekAvailability.dates.length} appointment(s): ${weekAvailability.dates.join(', ')}`);
            } else {
                console.log('❌ Not available in target week');
            }
            
            console.log('');
            console.log('⚡ Earliest available appointment:');
            if (earliestInfo.available) {
                console.log(`✅ ${earliestInfo.earliestDate} (in ${earliestInfo.daysFromNow} days)`);
                console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
            } else {
                console.log('❌ No future appointments available');
                if (earliestInfo.note) {
                    console.log(`📝 ${earliestInfo.note}`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing Calendly connection:', error.message);
        console.log('');
        console.log('💡 Troubleshooting tips:');
        console.log('  • Check your internet connection');
        console.log('  • Verify the Calendly URL is correct');
        console.log('  • The Calendly page might be blocking automated requests');
        console.log('  • Try visiting the URL in a browser to see if it loads');
    }
}

testCalendlyConnection();