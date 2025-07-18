#!/usr/bin/env node

const HairdresserScheduler = require('./hairdresser-scheduler-fixed.js');

async function debugCurrentHTML() {
    console.log('🔍 Debug: Fetching Current Calendly HTML');
    console.log('=========================================');
    console.log('');

    const scheduler = new HairdresserScheduler();
    
    try {
        console.log('📡 Fetching current month from Calendly...');
        const html = await scheduler.fetchCalendlyPage();
        
        console.log(`✅ Successfully fetched page (${html.length} characters)`);
        console.log('');
        
        // Show a manageable sample of the HTML
        console.log('📄 First 2000 characters of HTML:');
        console.log('='.repeat(80));
        console.log(html.substring(0, 2000));
        console.log('='.repeat(80));
        console.log('');
        
        // Look for key patterns
        console.log('🔍 Looking for key patterns:');
        console.log(`  Contains "beschikbare tijden": ${html.includes('beschikbare tijden')}`);
        console.log(`  Contains "geen beschikbare": ${html.includes('geen beschikbare')}`);
        console.log(`  Contains "aria-label": ${html.includes('aria-label')}`);
        console.log(`  Contains "calendly": ${html.toLowerCase().includes('calendly')}`);
        console.log(`  Contains "<button": ${html.includes('<button')}`);
        console.log(`  Contains "August": ${html.includes('August')}`);
        console.log(`  Contains "July": ${html.includes('July')}`);
        console.log('');
        
        // Test the new parsing function
        console.log('🧪 Testing new parsing function:');
        const dates = scheduler.parseAvailableDates(html);
        
        if (dates.length > 0) {
            console.log(`✅ New parser found ${dates.length} dates: ${dates.join(', ')}`);
        } else {
            console.log('⚠️ New parser found no dates');
            
            // Show more diagnostic info
            console.log('\n🔍 Additional diagnostics:');
            
            // Look for any aria-label patterns
            const ariaLabels = html.match(/aria-label="[^"]*"/g);
            if (ariaLabels) {
                console.log(`Found ${ariaLabels.length} aria-label attributes:`);
                ariaLabels.slice(0, 10).forEach((label, index) => {
                    console.log(`  ${index + 1}. ${label}`);
                });
                if (ariaLabels.length > 10) {
                    console.log(`  ... and ${ariaLabels.length - 10} more`);
                }
            } else {
                console.log('No aria-label attributes found');
            }
            
            // Look for any Dutch text
            const dutchPatterns = ['beschikbare', 'geen', 'tijden', 'augustus', 'juli'];
            console.log('\nDutch text patterns:');
            dutchPatterns.forEach(pattern => {
                const count = (html.toLowerCase().match(new RegExp(pattern, 'g')) || []).length;
                console.log(`  "${pattern}": ${count} occurrences`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error fetching HTML:', error.message);
        console.log('\nTroubleshooting:');
        console.log('• Check your internet connection');
        console.log('• The Calendly URL might have changed');
        console.log('• Calendly might be blocking automated requests');
    }
}

debugCurrentHTML();