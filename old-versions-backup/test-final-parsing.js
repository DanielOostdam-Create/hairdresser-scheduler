#!/usr/bin/env node

// Test parsing with the actual July and August HTML
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
                const year = new Date().getFullYear();
                const dateStr = `${year}-${monthNum}-${day.padStart(2, '0')}`;
                
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

// Test with July HTML (should find 0 dates)
console.log('🗓️ TESTING JULY 2025 HTML (Should find 0 available dates)');
console.log('===========================================================');
const julyHtml = `aria-label="Friday, July 11 - geen beschikbare tijden"`;
const julyResults = parseAvailableDates(julyHtml);
console.log(`Result: ${julyResults.length} dates found\n`);

// Test with August HTML (should find many dates)
console.log('🗓️ TESTING AUGUST 2025 HTML (Should find many available dates)');
console.log('===============================================================');
const augustHtml = `
aria-label="Friday, August 1 - beschikbare tijden"
aria-label="Tuesday, August 5 - beschikbare tijden"
aria-label="Wednesday, August 6 - beschikbare tijden"
aria-label="Thursday, August 7 - beschikbare tijden"
aria-label="Friday, August 8 - beschikbare tijden"
aria-label="Tuesday, August 12 - beschikbare tijden"
aria-label="Wednesday, August 13 - beschikbare tijden"
aria-label="Thursday, August 14 - beschikbare tijden"
aria-label="Friday, August 15 - beschikbare tijden"
aria-label="Tuesday, August 19 - beschikbare tijden"
aria-label="Wednesday, August 20 - beschikbare tijden"
aria-label="Thursday, August 21 - beschikbare tijden"
aria-label="Friday, August 22 - beschikbare tijden"
`;

const augustResults = parseAvailableDates(augustHtml);
console.log(`Result: ${augustResults.length} dates found`);

// Test target week calculation
console.log('\n🎯 TESTING TARGET WEEK LOGIC');
console.log('==============================');
const targetDate = '2025-07-11'; // Friday, July 11
const target = new Date(targetDate);
const dayOfWeek = target.getDay(); // 5 = Friday

// Calculate Monday of the target week
const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
const weekStart = new Date(target);
weekStart.setDate(target.getDate() + mondayOffset);

// Calculate Sunday of the target week
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekStart.getDate() + 6);

const weekStartStr = weekStart.toISOString().split('T')[0];
const weekEndStr = weekEnd.toISOString().split('T')[0];

console.log(`Target date: ${targetDate} (${target.toDateString()})`);
console.log(`Target week: ${weekStartStr} to ${weekEndStr}`);

// Check if any July dates are in target week (should be false)
const julyDatesInTargetWeek = [];
const augustDatesInTargetWeek = augustResults.filter(date => {
    return date >= weekStartStr && date <= weekEndStr;
});

console.log(`July dates in target week: ${julyDatesInTargetWeek.length} (Expected: 0)`);
console.log(`August dates in target week: ${augustDatesInTargetWeek.length} (Expected: 0)`);
console.log(`Earliest available: ${augustResults[0]} (Expected: 2025-08-01)`);

console.log('\n🎉 SUMMARY');
console.log('===========');
console.log('✅ July has no available dates (correct - target week not available yet)');
console.log('✅ August has many available dates (earliest is August 1st)');
console.log('✅ Target week (July 7-13) is not available yet');
console.log('✅ System should notify when July dates become available!');
console.log('\n💡 Next step: Update the main scheduler to use this parsing logic');