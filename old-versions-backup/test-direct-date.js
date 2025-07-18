#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function testDirectDateAccess() {
    console.log('🔍 Testing Direct Date Access for August 1st');
    console.log('==============================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        // Test accessing August 1st directly
        const testDate = '2025-08-01';
        console.log(`📅 Testing direct access to ${testDate}...`);
        
        const result = await scheduler.fetchSpecificDate(testDate);
        
        console.log(`✅ Successfully fetched ${testDate} page (${result.html.length} characters)`);
        console.log(`🔗 URL: ${result.url}`);
        console.log('');
        
        if (result.html.length < 2000) {
            console.log('⚠️ Response seems small, showing full content:');
            console.log('='.repeat(60));
            console.log(result.html);
            console.log('='.repeat(60));
        } else {
            console.log('✅ Response size looks good! Showing first 1000 characters:');
            console.log('='.repeat(60));
            console.log(result.html.substring(0, 1000) + '...');
            console.log('='.repeat(60));
        }
        
        console.log('');
        console.log('🔍 Looking for time patterns:');
        
        // Check for time patterns
        const timePatterns = [
            /09:30/g,
            /15:00/g,
            /\b(\d{1,2}:\d{2})\b/g
        ];
        
        timePatterns.forEach((pattern, index) => {
            const matches = result.html.match(pattern);
            if (index < 2) {
                console.log(`  ${pattern.source}: ${matches ? '✅ Found' : '❌ Not found'}`);
                if (matches) {
                    console.log(`    Occurrences: ${matches.length}`);
                }
            } else {
                console.log(`  General time pattern: ${matches ? `✅ Found ${matches.length} times` : '❌ Not found'}`);
                if (matches && matches.length > 0) {
                    const uniqueTimes = [...new Set(matches)].sort();
                    console.log(`    Times found: ${uniqueTimes.slice(0, 10).join(', ')}`);
                }
            }
        });
        
        // Test the parsing function
        console.log('');
        console.log('🎯 Testing time slot parsing:');
        const timeSlots = scheduler.parseTimeSlots(result.html, testDate);
        
        if (timeSlots.length > 0) {
            console.log(`🎉 SUCCESS! Found ${timeSlots.length} time slots: ${timeSlots.join(', ')}`);
        } else {
            console.log('❌ No time slots detected by parser');
        }
        
    } catch (error) {
        console.error('❌ Error testing direct date access:', error.message);
        console.log('Error details:', error);
    }
}

testDirectDateAccess();