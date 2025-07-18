#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler-fixed.js');

async function testFixedSystem() {
    console.log('🧪 Testing Fixed Hairdresser Appointment System');
    console.log('===============================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('🔍 Testing improved multi-month availability checking...');
        console.log('');
        
        // Test the improved checkMultipleMonths function
        const availableDates = await scheduler.checkMultipleMonths(3);
        
        console.log('\n🎯 SYSTEM TEST RESULTS:');
        console.log('========================');
        
        if (availableDates.length > 0) {
            console.log(`✅ SUCCESS! Found ${availableDates.length} available dates:`);
            
            availableDates.forEach((date, index) => {
                const dateObj = new Date(date);
                const today = new Date();
                const diffTime = dateObj - today;
                const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                console.log(`  ${index + 1}. ${date} (in ${daysFromNow} days)`);
            });
            
            // Test target week functionality
            const data = await scheduler.loadData();
            if (data) {
                const weekInfo = scheduler.isTargetWeekAvailable(availableDates, data.targetDate);
                console.log('');
                console.log(`🎯 Target week (${weekInfo.weekStart} to ${weekInfo.weekEnd}):`);
                if (weekInfo.available) {
                    console.log(`🎉 TARGET WEEK AVAILABLE! Found ${weekInfo.dates.length} appointment(s): ${weekInfo.dates.join(', ')}`);
                } else {
                    console.log(`⏳ Target week not yet available`);
                    
                    // Show earliest available as alternative
                    const earliest = availableDates[0];
                    const earliestObj = new Date(earliest);
                    const today = new Date();
                    const diffTime = earliestObj - today;
                    const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    console.log(`⚡ Earliest available: ${earliest} (in ${daysFromNow} days)`);
                }
            }
            
        } else {
            console.log('⚠️ No available dates found. This could mean:');
            console.log('   • No appointments are currently available (normal)');
            console.log('   • The HTML parsing logic needs further adjustment');
            console.log('   • The Calendly page structure has changed');
            console.log('');
            console.log('💡 To debug further:');
            console.log('   1. Check what HTML is actually being fetched');
            console.log('   2. Look for the specific patterns in the HTML');
            console.log('   3. Update the parsing logic if needed');
        }
        
        console.log('\n✅ Fixed system test complete!');
        console.log('💡 You can now run: node hairdresser-scheduler-fixed.js check');
        
    } catch (error) {
        console.error('❌ Error testing fixed system:', error.message);
        console.log('\nError details:', error);
    }
}

// Test parsing with sample HTML
function testParsingLogic() {
    console.log('\n🧪 Testing Parsing Logic with Sample Data');
    console.log('==========================================');
    
    const scheduler = new HairdresserScheduler();
    
    // Test with sample HTML that matches the expected format
    const sampleHtml = `
    <button aria-label="Friday, August 1 - beschikbare tijden">1</button>
    <button aria-label="Tuesday, August 5 - beschikbare tijden">5</button>
    <button aria-label="Wednesday, August 6 - beschikbare tijden">6</button>
    <button aria-label="Friday, July 11 - beschikbare tijden">11</button>
    <button aria-label="Monday, July 14 - beschikbare tijden">14</button>
    <button aria-label="Tuesday, July 15 - geen beschikbare tijden">15</button>
    `;
    
    console.log('Sample HTML:', sampleHtml);
    console.log('');
    
    const parsedDates = scheduler.parseAvailableDates(sampleHtml);
    
    console.log('🎯 Expected: Should find August 1, 5, 6 and July 11, 14');
    console.log(`✅ Actual: Found ${parsedDates.length} dates: ${parsedDates.join(', ')}`);
    
    if (parsedDates.includes('2025-08-01') && parsedDates.includes('2025-07-11')) {
        console.log('🎉 Parsing logic is working correctly!');
    } else {
        console.log('⚠️ Parsing logic may need adjustment');
    }
}

// Run both tests
async function runAllTests() {
    testParsingLogic();
    await testFixedSystem();
}

runAllTests();