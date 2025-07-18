#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function testNewURL() {
    console.log('🔍 Testing New Calendly URL');
    console.log('============================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching Calendly page...');
        console.log('URL:', scheduler.calendlyUrl);
        
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`✅ Successfully fetched page (${html.length} characters)`);
        console.log('');
        
        if (html.length < 5000) {
            console.log('⚠️ Response still seems small, showing full content:');
            console.log('='.repeat(60));
            console.log(html);
            console.log('='.repeat(60));
        } else {
            console.log('✅ Response size looks good! Showing first 1000 characters:');
            console.log('='.repeat(60));
            console.log(html.substring(0, 1000) + '...');
            console.log('='.repeat(60));
        }
        
        console.log('');
        console.log('🔍 Quick content checks:');
        console.log(`Contains "August": ${html.includes('August')}`);
        console.log(`Contains "2025-08": ${html.includes('2025-08')}`);
        console.log(`Contains "2025-08-01": ${html.includes('2025-08-01')}`);
        console.log(`Contains "calendly": ${html.toLowerCase().includes('calendly')}`);
        console.log(`Contains "available": ${html.toLowerCase().includes('available')}`);
        console.log(`Contains "time": ${html.toLowerCase().includes('time')}`);
        console.log(`Contains "appointment": ${html.toLowerCase().includes('appointment')}`);
        
        // Test parsing
        console.log('');
        console.log('🔍 Testing date parsing:');
        const availableDates = scheduler.parseAvailableDates(html);
        console.log(`Found ${availableDates.length} dates`);
        
        if (availableDates.length > 0) {
            console.log('📅 Available dates:', availableDates.join(', '));
            
            // Test earliest available
            const earliestInfo = scheduler.findEarliestAvailable(availableDates);
            if (earliestInfo.available) {
                console.log(`⚡ Earliest: ${earliestInfo.earliestDate} (${earliestInfo.daysFromNow} days from now)`);
                console.log(`📊 Total future appointments: ${earliestInfo.totalAvailable}`);
                
                // Test target week
                const data = await scheduler.loadData();
                if (data) {
                    const weekAvailability = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
                    console.log(`🎯 Target week availability: ${weekAvailability.available ? 'YES' : 'NO'}`);
                    if (weekAvailability.available) {
                        console.log(`📅 Target week dates: ${weekAvailability.dates.join(', ')}`);
                    }
                }
            }
        } else {
            console.log('❌ No dates found');
            
            // Look for specific patterns that might indicate the page structure
            console.log('');
            console.log('🔍 Looking for calendar indicators:');
            const calendarIndicators = [
                'data-date',
                'calendar',
                'slot',
                'booking',
                'schedule',
                'time-slot',
                'available-time'
            ];
            
            calendarIndicators.forEach(indicator => {
                const found = html.toLowerCase().includes(indicator.toLowerCase());
                console.log(`  ${indicator}: ${found ? '✅' : '❌'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error testing new URL:', error.message);
    }
}

testNewURL();