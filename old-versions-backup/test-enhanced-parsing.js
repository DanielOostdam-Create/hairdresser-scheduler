#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

// Enhanced parser function to replace the existing one
function enhancedParseAvailableDates(html) {
    const dates = [];
    
    console.log(`🔍 Enhanced parsing HTML content (${html.length} characters)`);
    
    // Enhanced patterns to catch various date formats Calendly might use
    const datePatterns = [
        // Standard YYYY-MM-DD format
        /data-date="(\d{4}-\d{2}-\d{2})"/g,
        /date["\s]*[:=]["\s]*"(\d{4}-\d{2}-\d{2})"/g,
        /"(\d{4}-\d{2}-\d{2})"/g,
        
        // JSON or API response patterns
        /"date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g,
        /"startDate"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g,
        /"start_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/g,
        
        // Alternative formats
        /'(\d{4}-\d{2}-\d{2})'/g,
        /\b(\d{4}-\d{2}-\d{2})\b/g,
        
        // Calendly-specific patterns
        /data-.*date.*="([^"]*\d{4}-\d{2}-\d{2}[^"]*)"/g,
        /calendly.*date.*["'](\d{4}-\d{2}-\d{2})["']/g,
        
        // ISO format with time
        /"(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}/g,
        
        // More generic patterns
        /available.*"(\d{4}-\d{2}-\d{2})"/g,
        /slot.*"(\d{4}-\d{2}-\d{2})"/g
    ];

    datePatterns.forEach((pattern, index) => {
        let match;
        let patternMatches = 0;
        const patternDates = [];
        
        // Reset regex lastIndex to avoid issues with global flag
        pattern.lastIndex = 0;
        
        while ((match = pattern.exec(html)) !== null) {
            const date = match[1];
            // Clean up the date string (remove time if present)
            const cleanDate = date.split('T')[0];
            
            // Validate it's a proper date format
            if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) && !dates.includes(cleanDate)) {
                dates.push(cleanDate);
                patternDates.push(cleanDate);
            }
            patternMatches++;
            
            // Prevent infinite loops
            if (patternMatches > 1000) break;
        }
        
        if (patternDates.length > 0) {
            console.log(`  Pattern ${index + 1}: Found ${patternDates.length} dates - ${patternDates.slice(0, 3).join(', ')}${patternDates.length > 3 ? '...' : ''}`);
        }
    });

    // Also look for JavaScript date objects or arrays
    console.log('🔍 Looking for JavaScript date patterns...');
    const jsPatterns = [
        /new Date\(["'](\d{4}-\d{2}-\d{2})["']\)/g,
        /Date\(["'](\d{4}-\d{2}-\d{2})["']\)/g,
        /\["(\d{4}-\d{2}-\d{2})"/g,
        /dates?\s*[=:]\s*\[([^\]]*\d{4}-\d{2}-\d{2}[^\]]*)\]/g
    ];
    
    jsPatterns.forEach((pattern, index) => {
        let match;
        let jsMatches = 0;
        
        pattern.lastIndex = 0;
        
        while ((match = pattern.exec(html)) !== null) {
            const date = match[1];
            
            if (pattern.source.includes('\\[')) {
                // Handle array pattern - extract all dates from the array
                const arrayContent = match[1];
                const arrayDates = arrayContent.match(/\d{4}-\d{2}-\d{2}/g) || [];
                arrayDates.forEach(arrayDate => {
                    if (!dates.includes(arrayDate)) {
                        dates.push(arrayDate);
                    }
                });
                jsMatches += arrayDates.length;
            } else {
                // Single date
                const cleanDate = date.split('T')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate) && !dates.includes(cleanDate)) {
                    dates.push(cleanDate);
                    jsMatches++;
                }
            }
            
            if (jsMatches > 1000) break;
        }
        
        if (jsMatches > 0) {
            console.log(`  JS Pattern ${index + 1}: Found ${jsMatches} dates`);
        }
    });
    
    // Remove duplicates and sort
    const uniqueDates = [...new Set(dates)].sort();
    
    console.log(`📅 Total unique dates found: ${uniqueDates.length}`);
    if (uniqueDates.length > 0) {
        console.log(`📋 Sample dates: ${uniqueDates.slice(0, 10).join(', ')}${uniqueDates.length > 10 ? '...' : ''}`);
    }
    
    return uniqueDates;
}

async function testEnhancedParsing() {
    console.log('🔧 Testing Enhanced Date Parsing');
    console.log('=================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching Calendly page...');
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`✅ Successfully fetched page (${html.length} characters)`);
        console.log('');
        
        // Show a sample of the page
        console.log('📄 Page sample (first 1000 characters):');
        console.log('='.repeat(60));
        console.log(html.substring(0, 1000));
        console.log('='.repeat(60));
        console.log('');
        
        // Test the original parsing function
        console.log('🔧 Original parsing results:');
        const originalDates = scheduler.parseAvailableDates(html);
        console.log(`Original found: ${originalDates.length} dates`);
        if (originalDates.length > 0) {
            console.log(`Dates: ${originalDates.join(', ')}`);
        }
        console.log('');
        
        // Test the enhanced parsing function
        console.log('🚀 Enhanced parsing results:');
        const enhancedDates = enhancedParseAvailableDates(html);
        console.log(`Enhanced found: ${enhancedDates.length} dates`);
        if (enhancedDates.length > 0) {
            console.log(`Dates: ${enhancedDates.join(', ')}`);
        }
        console.log('');
        
        // Check specifically for August 1st in various forms
        console.log('🎯 Looking specifically for August 1st, 2025:');
        const august1Checks = [
            html.includes('2025-08-01'),
            html.includes('August 1'),
            html.includes('Aug 1'),
            html.includes('08-01'),
            html.includes('08/01'),
            html.includes('1 August'),
            html.includes('1st August')
        ];
        
        const august1Labels = [
            '2025-08-01',
            'August 1',
            'Aug 1', 
            '08-01',
            '08/01',
            '1 August',
            '1st August'
        ];
        
        august1Checks.forEach((found, index) => {
            console.log(`  ${august1Labels[index]}: ${found ? '✅ Found' : '❌ Not found'}`);
        });
        
        // Search for any August references
        const augustMatches = html.match(/august|2025-08|08-2025/gi);
        console.log(`\n📅 August references found: ${augustMatches ? augustMatches.length : 0}`);
        if (augustMatches && augustMatches.length > 0) {
            console.log(`Examples: ${augustMatches.slice(0, 10).join(', ')}`);
        }
        
        // Check if the earliest function would work
        console.log('\n⚡ Testing earliest available function:');
        const earliestInfo = scheduler.findEarliestAvailable(enhancedDates);
        if (earliestInfo.available) {
            console.log(`✅ Earliest: ${earliestInfo.earliestDate} (${earliestInfo.daysFromNow} days from now)`);
            console.log(`📊 Total available: ${earliestInfo.totalAvailable}`);
        } else {
            console.log('❌ No future dates found');
            if (earliestInfo.note) {
                console.log(`Note: ${earliestInfo.note}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error testing enhanced parsing:', error.message);
        console.log('\nError details:', error);
    }
}

testEnhancedParsing();