#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function testCalendarParsing() {
    console.log('🔍 Testing Calendar Parsing for Available Dates');
    console.log('===============================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        // Test the calendar page parsing
        const url = 'https://calendly.com/kapper_eric/30min?back=1&month=2025-08';
        console.log(`📅 Fetching calendar for August 2025...`);
        console.log(`URL: ${url}`);
        
        // Update the URL temporarily for this test
        scheduler.baseCalendlyUrl = url;
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`✅ Successfully fetched calendar page (${html.length} characters)`);
        console.log('');
        
        // Look for the specific pattern we know exists
        console.log('🔍 Looking for "beschikbare tijden" (available times):');
        
        const availablePattern = /aria-label="[^"]*beschikbare tijden[^"]*"/g;
        const matches = html.match(availablePattern);
        
        if (matches) {
            console.log(`✅ Found ${matches.length} dates with available times:`);
            matches.forEach((match, index) => {
                console.log(`  ${index + 1}. ${match}`);
                
                // Try to extract the date
                const dateMatch = match.match(/(\w+),\s*(\w+)\s*(\d{1,2})/);
                if (dateMatch) {
                    const [, dayName, month, day] = dateMatch;
                    console.log(`     Parsed: ${dayName}, ${month} ${day}`);
                }
            });
        } else {
            console.log('❌ No "beschikbare tijden" found');
        }
        
        console.log('');
        console.log('🔍 Looking for the specific August 1st button:');
        
        // Look for the specific August 1st pattern from the user's HTML
        const august1Pattern = /aria-label="[^"]*August 1[^"]*beschikbare tijden[^"]*"/i;
        const august1Match = html.match(august1Pattern);
        
        if (august1Match) {
            console.log(`✅ Found August 1st with available times: ${august1Match[0]}`);
        } else {
            console.log('❌ August 1st pattern not found');
            
            // Look for any August 1 reference
            const anyAugust1 = html.match(/August 1|augustus 1/gi);
            if (anyAugust1) {
                console.log(`ℹ️ Found ${anyAugust1.length} references to August 1: ${anyAugust1.join(', ')}`);
            }
        }
        
        console.log('');
        console.log('🔍 Looking for any date buttons:');
        
        // Look for button patterns with aria-labels
        const buttonPattern = /<button[^>]*aria-label="[^"]*"[^>]*><span>(\d{1,2})<\/span><\/button>/g;
        let buttonMatch;
        let buttonCount = 0;
        
        while ((buttonMatch = buttonPattern.exec(html)) !== null && buttonCount < 10) {
            const day = buttonMatch[1];
            const fullMatch = buttonMatch[0];
            const ariaLabel = fullMatch.match(/aria-label="([^"]*)"/)?.[1];
            
            console.log(`  Day ${day}: ${ariaLabel}`);
            buttonCount++;
        }
        
        if (buttonCount === 0) {
            console.log('❌ No date buttons found with the expected pattern');
        }
        
        console.log('');
        console.log('📄 First 2000 characters of HTML:');
        console.log('='.repeat(60));
        console.log(html.substring(0, 2000));
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('❌ Error testing calendar parsing:', error.message);
    }
}

testCalendarParsing();