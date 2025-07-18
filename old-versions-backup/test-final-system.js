#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

// Create a working test of the final system
function parseAvailableDates(html) {
    const dates = [];
    
    console.log(`🔍 Parsing calendar HTML for available dates (${html.length} characters)`);
    
    // Look for buttons with "beschikbare tijden" (available times) in Dutch
    const availablePattern = /aria-label="([^"]*) - beschikbare tijden"/g;
    
    let match;
    while ((match = availablePattern.exec(html)) !== null) {
        const fullLabel = match[1];
        console.log(`  Found available date label: ${fullLabel}`);
        
        // Extract date from labels like "Friday, August 1" or "Tuesday, August 5"
        const dateMatch = fullLabel.match(/(\w+),\s+(\w+)\s+(\d{1,2})/);
        if (dateMatch) {
            const [, dayName, monthName, day] = dateMatch;
            
            // Convert month name to number (support both English and Dutch)
            const monthMap = {
                'January': '01', 'February': '02', 'March': '03', 'April': '04',
                'May': '05', 'June': '06', 'July': '07', 'August': '08',
                'September': '09', 'October': '10', 'November': '11', 'December': '12',
                'januari': '01', 'februari': '02', 'maart': '03', 'april': '04',
                'mei': '05', 'juni': '06', 'juli': '07', 'augustus': '08',
                'september': '09', 'oktober': '10', 'november': '11', 'december': '12'
            };
            
            const monthNum = monthMap[monthName] || monthMap[monthName.toLowerCase()];
            if (monthNum) {
                // Use 2025 as the year
                const dateStr = `2025-${monthNum}-${day.padStart(2, '0')}`;
                
                if (!dates.includes(dateStr)) {
                    dates.push(dateStr);
                    console.log(`  ✅ Parsed available date: ${dateStr} (${dayName}, ${monthName} ${day})`);
                }
            }
        }
    }
    
    console.log(`📅 Total available dates found: ${dates.length}`);
    if (dates.length > 0) {
        console.log(`📋 Available dates: ${dates.sort().join(', ')}`);
    }
    
    return dates.sort();
}

async function testFinalSystem() {
    console.log('🚀 Testing Final Hairdresser Appointment System');
    console.log('===============================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    // Test multiple months to catch all availability
    const monthsToCheck = [
        '2025-07', // July (target month)
        '2025-08', // August (where we know there's availability)
        '2025-09'  // September (future availability)
    ];
    
    const allAvailableDates = [];
    
    for (const month of monthsToCheck) {
        try {
            const url = `https://calendly.com/kapper_eric/30min?back=1&month=${month}`;
            console.log(`📅 Checking ${month}...`);
            console.log(`URL: ${url}`);
            
            // Temporarily update URL for this month
            scheduler.baseCalendlyUrl = url;
            const html = await scheduler.fetchCalendlyPage();
            
            console.log(`✅ Fetched ${month} calendar (${html.length} characters)`);
            
            // Parse available dates from this month
            const monthDates = parseAvailableDates(html);
            
            if (monthDates.length > 0) {
                console.log(`✅ ${month}: Found ${monthDates.length} available dates`);
                allAvailableDates.push(...monthDates);
            } else {
                console.log(`❌ ${month}: No available dates found`);
            }
            
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error checking ${month}:`, error.message);
        }
    }
    
    // Remove duplicates and analyze results
    const uniqueDates = [...new Set(allAvailableDates)].sort();
    
    console.log('🎯 FINAL RESULTS:');
    console.log('==================');
    console.log(`Total available dates found: ${uniqueDates.length}`);
    
    if (uniqueDates.length > 0) {
        console.log('📅 All available dates:');
        uniqueDates.forEach((date, index) => {
            const dateObj = new Date(date);
            const today = new Date();
            const diffTime = dateObj - today;
            const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            console.log(`  ${index + 1}. ${date} (in ${daysFromNow} days)`);
        });
        
        // Check target week availability  
        const targetDate = '2025-07-11';
        const target = new Date(targetDate);
        const dayOfWeek = target.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(target);
        weekStart.setDate(target.getDate() + mondayOffset);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];
        
        const targetWeekDates = uniqueDates.filter(date => {
            return date >= weekStartStr && date <= weekEndStr;
        });
        
        console.log('');
        console.log(`🎯 Target week (${weekStartStr} to ${weekEndStr}):`);
        if (targetWeekDates.length > 0) {
            console.log(`🎉 TARGET WEEK AVAILABLE! Found ${targetWeekDates.length} appointment(s): ${targetWeekDates.join(', ')}`);
        } else {
            console.log(`⏳ Target week not yet available`);
            
            // Show earliest available as alternative
            if (uniqueDates.length > 0) {
                const earliest = uniqueDates[0];
                const earliestObj = new Date(earliest);
                const today = new Date();
                const diffTime = earliestObj - today;
                const daysFromNow = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                console.log(`⚡ Earliest available: ${earliest} (in ${daysFromNow} days)`);
            }
        }
        
    } else {
        console.log('❌ No available appointments found in any month checked');
        console.log('💡 This is normal - slots open up over time, which is why we monitor hourly!');
    }
    
    console.log('');
    console.log('✅ System test complete! The hourly monitoring will catch when new slots open up.');
}

testFinalSystem();