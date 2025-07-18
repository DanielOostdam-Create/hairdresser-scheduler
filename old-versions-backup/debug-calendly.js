#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler.js');

async function detailedCalendlyTest() {
    console.log('🔧 Detailed Calendly Connection Test');
    console.log('=====================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching Calendly page...');
        console.log('URL:', scheduler.calendlyUrl);
        
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`✅ Successfully fetched page (${html.length} characters)`);
        console.log('');
        
        // Show more of the page content
        console.log('📄 First 2000 characters of page:');
        console.log('='.repeat(80));
        console.log(html.substring(0, 2000));
        console.log('='.repeat(80));
        console.log('');
        
        // Test various date patterns more thoroughly
        console.log('🔍 Testing date pattern detection:');
        console.log('');
        
        // Pattern 1: Standard YYYY-MM-DD format
        const pattern1 = /\d{4}-\d{2}-\d{2}/g;
        const matches1 = html.match(pattern1);
        console.log('Pattern 1 (YYYY-MM-DD):');
        console.log(`  Matches: ${matches1 ? matches1.length : 0}`);
        if (matches1) {
            console.log(`  Examples: ${matches1.slice(0, 10).join(', ')}`);
        }
        console.log('');
        
        // Pattern 2: Look for August specifically
        const augustPattern = /august|2025-08|08-2025/gi;
        const augustMatches = html.match(augustPattern);
        console.log('Pattern 2 (August references):');
        console.log(`  Matches: ${augustMatches ? augustMatches.length : 0}`);
        if (augustMatches) {
            console.log(`  Examples: ${augustMatches.slice(0, 10).join(', ')}`);
        }
        console.log('');
        
        // Pattern 3: JSON data patterns
        const jsonPattern = /"(\d{4}-\d{2}-\d{2})"/g;
        const jsonMatches = html.match(jsonPattern);
        console.log('Pattern 3 (JSON dates):');
        console.log(`  Matches: ${jsonMatches ? jsonMatches.length : 0}`);
        if (jsonMatches) {
            console.log(`  Examples: ${jsonMatches.slice(0, 10).join(', ')}`);
        }
        console.log('');
        
        // Pattern 4: Look for Calendly-specific data attributes
        const calendlyPattern = /data-[^=]*date[^=]*=["']([^"']+)["']/gi;
        let calendlyMatch;
        const calendlyMatches = [];
        while ((calendlyMatch = calendlyPattern.exec(html)) !== null) {
            calendlyMatches.push(calendlyMatch[1]);
        }
        console.log('Pattern 4 (Calendly data attributes):');
        console.log(`  Matches: ${calendlyMatches.length}`);
        if (calendlyMatches.length > 0) {
            console.log(`  Examples: ${calendlyMatches.slice(0, 10).join(', ')}`);
        }
        console.log('');
        
        // Test our current parsing function
        console.log('🎯 Testing current parseAvailableDates function:');
        const availableDates = scheduler.parseAvailableDates(html);
        console.log(`  Found ${availableDates.length} dates`);
        if (availableDates.length > 0) {
            console.log(`  Dates: ${availableDates.join(', ')}`);
        }
        console.log('');
        
        // Test specifically for August 1st
        const hasAugust1 = html.includes('2025-08-01') || html.includes('August 1') || html.includes('Aug 1');
        console.log('🎯 Specific August 1st check:');
        console.log(`  Contains "2025-08-01": ${html.includes('2025-08-01')}`);
        console.log(`  Contains "August 1": ${html.includes('August 1')}`);
        console.log(`  Contains "Aug 1": ${html.includes('Aug 1')}`);
        console.log('');
        
        // Look for JavaScript or script tags that might contain data
        const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gis);
        console.log('📜 Script tags analysis:');
        console.log(`  Found ${scriptMatches ? scriptMatches.length : 0} script tags`);
        
        if (scriptMatches) {
            scriptMatches.forEach((script, index) => {
                if (script.includes('2025') || script.includes('date') || script.includes('August')) {
                    console.log(`  Script ${index + 1} contains date-related content (${script.length} chars)`);
                    // Show first 200 characters of relevant scripts
                    const scriptContent = script.substring(0, 500);
                    console.log(`    Preview: ${scriptContent}...`);
                }
            });
        }
        console.log('');
        
        // Check response headers or status
        console.log('📊 Summary:');
        console.log(`  Page size: ${html.length} characters`);
        console.log(`  Contains HTML: ${html.includes('<html') || html.includes('<!DOCTYPE')}`);
        console.log(`  Contains Calendly: ${html.includes('calendly') || html.includes('Calendly')}`);
        console.log(`  Looks like error page: ${html.includes('error') || html.includes('404') || html.includes('not found')}`);
        
    } catch (error) {
        console.error('❌ Error testing Calendly connection:', error.message);
        console.log('');
        console.log('💡 Detailed troubleshooting:');
        console.log('  • Error type:', error.constructor.name);
        console.log('  • Error code:', error.code || 'N/A');
        console.log('  • Error syscall:', error.syscall || 'N/A');
        console.log('');
        console.log('🔧 Possible issues:');
        console.log('  • Network connectivity problems');
        console.log('  • Calendly URL might be incorrect or changed');
        console.log('  • Calendly might be blocking automated requests');
        console.log('  • SSL/TLS certificate issues');
        console.log('  • Firewall or proxy blocking the request');
    }
}

detailedCalendlyTest();